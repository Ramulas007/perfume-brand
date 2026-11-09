// Analyzes a product image with Gemini vision and returns a unique listing + category suggestion.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, "Content-Type": "application/json" },
  });

const errorResponse = (message: string, status = 400, details = "") =>
  jsonResponse({ success: false, message, error: message, details }, status);

const readResponseText = async (response: Response, limit = 1200) => {
  try {
    const text = await response.text();
    return text.slice(0, limit);
  } catch (error) {
    console.error("[ai-product-analyze] response body read failed", {
      error,
      type: typeof error,
      constructor: (error as Error)?.constructor?.name,
    });
    return "Unable to read response body";
  }
};

interface CategoryLite { id: string; name: string; parent_id: string | null }

interface ReqBody {
  imageDataUrl?: string;             // data:image/...;base64,...
  imageUrl?: string;                 // public product image URL
  instructions?: string;             // admin's tone/style hints
  categories: CategoryLite[];        // full list to pick from
  userAnswers?: Record<string, string>; // answers to previous clarifying questions
  previousQuestions?: string[];
}

const cleanText = (value?: string, fallback = "Product") =>
  String(value || "").trim() || fallback;

const titleFromCategory = (category?: string) => {
  const name = cleanText(category, "Fashion Item");
  return name.toLowerCase().includes("product") ? name : `Premium ${name}`;
};

const buildFallbackProduct = (body: ReqBody) => {
  const selectedCategory = body.categories?.[0];
  const categoryName = cleanText(selectedCategory?.name, "Fashion");
  const productName = titleFromCategory(categoryName).slice(0, 70);
  const instructions = cleanText(body.instructions, "premium everyday style");

  return {
    success: true,
    fallback: true,
    name: productName,
    shortDescription: `${productName} with a clean Static Vibes look, comfortable feel, and everyday-ready finish.`,
    fullDescription: `${productName} is prepared as a premium Static Vibes listing so you can keep publishing even when AI is unavailable.\n\nThis item is styled for everyday wear with a modern, easy-to-match look. Review the product photo, adjust the exact color/design details, and publish once everything matches your stock.\n\nStyle note: ${instructions}.`,
    highlights: [
      "Premium Static Vibes styling",
      "Comfortable everyday look",
      "Easy to pair with casual outfits",
      "Ready to edit before publishing",
    ],
    features: ["Modern fashion fit", "Clean product presentation", "Suitable for daily use"],
    tags: [categoryName, "static vibes", "premium", "fashion", "bangladesh", "casual"].map((tag) => tag.toLowerCase()),
    seoKeywords: [productName, `${categoryName} Bangladesh`, "Static Vibes", "online fashion bd", "premium fashion"],
    metaTitle: `${productName} | Static Vibes`.slice(0, 60),
    metaDescription: `Shop ${productName} at Static Vibes Bangladesh. Premium ${categoryName.toLowerCase()} with modern style and comfort.`.slice(0, 160),
    careInstructions: "Wash gently with similar colors. Do not bleach. Dry in shade for long-lasting quality.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colorVariations: [],
    category_id: selectedCategory?.id || null,
    questions: [
      "AI fallback was used. Please confirm the exact product title, color, and design details before publishing.",
    ],
    analysis: {
      type: categoryName,
      designSubject: "Fallback content — review image manually",
      dominantColors: [],
      style: "casual streetwear",
      gender: "unisex",
      useCase: "everyday casual",
    },
  };
};

const fallbackProductResponse = async (
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: ReqBody,
  message: string,
  details = "",
) => {
  await admin.from("ai_generation_logs").insert({
    admin_id: userId,
    prompt_used: "product_vision_analyze_fallback",
    result_status: "fallback",
  });

  return jsonResponse({
    ...buildFallbackProduct(body),
    message,
    details,
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) return errorResponse("AI is not configured on the server.", 500, "No AI key configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Unauthorized: please sign in again before using Generate Product Magic.", 401);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return errorResponse("Unauthorized: your session expired. Please sign out and sign in again.", 401);
    }
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return errorResponse("Admin only: this account does not have permission to generate products.", 403);
    }

    const body = (await req.json()) as ReqBody;
    if (!body.imageUrl && (!body.imageDataUrl || !body.imageDataUrl.startsWith("data:image/"))) {
      return errorResponse("Product image is required for Generate Product Magic.", 400);
    }
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return errorResponse("Category list is missing. Refresh the admin panel and try again.", 400);
    }

    const catLines = body.categories
      .map((c) => `- id:${c.id} | name:${c.name}${c.parent_id ? " (sub-category)" : " (main)"}`)
      .join("\n");

    const answersBlock = body.userAnswers && Object.keys(body.userAnswers).length
      ? `\nAdmin answers to your previous clarifying questions:\n${
          Object.entries(body.userAnswers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join("\n")
        }\n`
      : "";

    const system = `You are a senior e-commerce merchandiser for a Bangladeshi streetwear/fashion brand called "Static Vibes".
You will look at ONE product photo and generate a UNIQUE, design-specific listing.

Rules — VERY IMPORTANT:
1. The product NAME must be UNIQUE and describe the ACTUAL design you see in the image (colors, graphic subject, motif, typography, character, silhouette). Never use generic templates like "Premium Oversized Urban Graphic T-Shirt". Bad: "Premium Cotton T-Shirt". Good: "Midnight Tiger Oversized Tee", "Retro Sunset Poster Tee", "Neon Skull Drop-Shoulder Tee".
2. Pick the BEST matching category_id from the provided list. Prefer a sub-category if it clearly fits. If you cannot confidently choose ONE category, set category_id to null and put 1-3 short clarifying questions in "questions" (e.g. "Is this a drop-shoulder or regular fit?").
3. If the image is ambiguous about product type, color, or intended audience, ask questions instead of guessing.
4. Output STRICT JSON only, no markdown, no prose outside the JSON.`;

    const userText = `Categories available:
${catLines}

Admin style instructions: ${body.instructions || "(none — use premium streetwear tone in English)"}
${answersBlock}
Return JSON with this exact shape:
{
  "name": "unique design-specific title (max 70 chars)",
  "shortDescription": "1-2 sentence hook",
  "fullDescription": "3-4 short paragraphs",
  "highlights": ["4-6 short bullets"],
  "features": ["3-5 short bullets"],
  "tags": ["6-10 lowercase tags"],
  "seoKeywords": ["5-8 keywords for Bangladesh market"],
  "metaTitle": "SEO title max 60 chars",
  "metaDescription": "max 160 chars",
  "careInstructions": "wash/care text",
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "colorVariations": [{ "name": "Black", "hex": "#000000" }],
  "category_id": "<uuid from list, or null if unsure>",
  "questions": ["clarifying question 1", "..."] ,
  "analysis": {
    "type": "e.g. Oversized T-Shirt / Poster / Hoodie",
    "designSubject": "what the graphic shows",
    "dominantColors": ["black","white"],
    "style": "streetwear/minimal/retro/...",
    "gender": "men/women/unisex",
    "useCase": "casual/party/gym/..."
  }
}
Rules for variants:
- "colorVariations" must list the ACTUAL visible/base product colors from the image only. Use common color names and hex values.
- "sizes" must suggest standard sellable sizes for the product type. For apparel use ["S","M","L","XL","XXL"] unless the image/answers suggest otherwise.
- If the product is not size-based, use an empty "sizes" array.
If everything is clear, "questions" must be an empty array.`;

    const useGemini = !!GEMINI_API_KEY;
    const aiUrl = useGemini
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (useGemini) {
      aiHeaders["Authorization"] = `Bearer ${GEMINI_API_KEY}`;
    } else {
      aiHeaders["Lovable-API-Key"] = LOVABLE_API_KEY!;
    }
    const modelName = useGemini ? "gemini-2.5-flash" : "google/gemini-2.5-flash";

    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: body.imageUrl || body.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await readResponseText(aiRes);
      if (aiRes.status === 429) {
        return fallbackProductResponse(admin, user.id, body, "AI is busy, so fallback product content was generated.", errText);
      }
      if (aiRes.status === 402) {
        return fallbackProductResponse(admin, user.id, body, "AI credits are exhausted, so fallback product content was generated.", errText);
      }
      if (aiRes.status >= 500) {
        return fallbackProductResponse(admin, user.id, body, "AI service is temporarily unavailable, so fallback product content was generated.", errText);
      }
      console.error("[ai-product-analyze] AI gateway error", {
        status: aiRes.status,
        statusText: aiRes.statusText,
        body: errText.slice(0, 500),
      });
      return errorResponse(`AI gateway error (${aiRes.status})`, aiRes.status, errText);
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to salvage: strip ```json fences
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // Validate the category_id if provided
    if (parsed.category_id && !body.categories.some((c) => c.id === parsed.category_id)) {
      parsed.category_id = null;
      parsed.questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      parsed.questions.unshift("Which category should this product belong to?");
    }

    parsed.sizes = Array.isArray(parsed.sizes) ? parsed.sizes.filter(Boolean) : [];
    parsed.colorVariations = Array.isArray(parsed.colorVariations)
      ? parsed.colorVariations
          .map((c: any) => ({
            name: String(c?.name || "").trim(),
            hex: String(c?.hex || "").trim(),
          }))
          .filter((c: any) => c.name)
      : [];

    await admin.from("ai_generation_logs").insert({
      admin_id: user.id,
      prompt_used: "product_vision_analyze",
      result_status: "success",
    });

    return jsonResponse(parsed);
  } catch (e: any) {
    console.error("[ai-product-analyze] failed", {
      error: e,
      type: typeof e,
      constructor: e?.constructor?.name,
    });
    return errorResponse(e?.message || "Unknown error", 400);
  }
});
