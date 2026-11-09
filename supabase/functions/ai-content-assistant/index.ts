// AI Content Assistant - generates product content via Lovable AI Gateway
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const errorResponse = (message: string, status = 400, details = "") =>
  jsonResponse({ success: false, message, error: message, details }, status);

const readResponseText = async (response: Response, limit = 1200) => {
  if (!(response instanceof Response)) return "";
  try {
    const text = await response.text();
    return text.slice(0, limit);
  } catch (error) {
    console.error("[ai-content-assistant] response body read failed", {
      error,
      type: typeof error,
      constructor: (error as Error)?.constructor?.name,
    });
    return "Unable to read response body";
  }
};

type Task =
  | "description_short"
  | "description_long"
  | "description_seo"
  | "title_enhance"
  | "title_variations"
  | "tags"
  | "seo_title"
  | "seo_meta"
  | "seo_keywords"
  | "social_facebook"
  | "social_instagram"
  | "social_promo"
  | "flash_title"
  | "flash_description"
  | "review_summary"
  | "query_summary";

const PROMPTS: Record<Task, (ctx: Ctx) => { system: string; user: string }> = {
  description_short: (c) => ({
    system: "You are an expert ecommerce copywriter. Reply with ONLY the requested text. No preamble.",
    user: `Write a punchy 1-2 sentence short product description (max 160 chars).\nProduct: ${c.name}\nCategory: ${c.category}\nExisting: ${c.description || "-"}`,
  }),
  description_long: (c) => ({
    system: "You are an expert ecommerce copywriter. Reply with ONLY the description. No preamble, no markdown headers.",
    user: `Write a compelling full product description (3-4 short paragraphs) highlighting features, quality, and benefits.\nProduct: ${c.name}\nCategory: ${c.category}\nExisting: ${c.description || "-"}`,
  }),
  description_seo: (c) => ({
    system: "You are an SEO copywriter. Reply with ONLY the description.",
    user: `Write an SEO-friendly product description (~200 words) naturally including relevant keywords for Bangladesh ecommerce market.\nProduct: ${c.name}\nCategory: ${c.category}`,
  }),
  title_enhance: (c) => ({
    system: "You are an ecommerce title expert. Reply with ONLY the improved title, no quotes.",
    user: `Improve this product title to be professional, clear, and SEO-friendly (under 70 chars):\n"${c.name}"\nCategory: ${c.category}`,
  }),
  title_variations: (c) => ({
    system: "Reply with exactly 5 numbered title variations, one per line. No extra text.",
    user: `Generate 5 SEO-optimized professional ecommerce title variations for:\n"${c.name}"\nCategory: ${c.category}`,
  }),
  tags: (c) => ({
    system: "Reply with ONLY a comma-separated list of tags. No numbering, no extra text.",
    user: `Generate 8-12 relevant product tags for:\n${c.name}\nCategory: ${c.category}`,
  }),
  seo_title: (c) => ({
    system: "Reply with ONLY the SEO title, no quotes. Max 60 characters.",
    user: `Generate an SEO meta title for product: ${c.name} | ${c.category}`,
  }),
  seo_meta: (c) => ({
    system: "Reply with ONLY the meta description. Max 160 characters.",
    user: `Generate an SEO meta description for product: ${c.name} | ${c.category}\n${c.description || ""}`,
  }),
  seo_keywords: (c) => ({
    system: "Reply with ONLY a comma-separated list of focus keywords. No extra text.",
    user: `Generate 6-10 SEO focus keywords for: ${c.name} (${c.category})`,
  }),
  social_facebook: (c) => ({
    system: "You write engaging Facebook posts. Reply with ONLY the caption with emojis and a CTA.",
    user: `Write a Facebook promotional caption for: ${c.name} (${c.category})`,
  }),
  social_instagram: (c) => ({
    system: "You write Instagram captions. Reply with ONLY the caption: engaging hook, line breaks, emojis, then 10-15 hashtags at the end.",
    user: `Write an Instagram caption for: ${c.name} (${c.category})`,
  }),
  social_promo: (c) => ({
    system: "Reply with ONLY a promotional caption. High energy, scarcity, emojis.",
    user: `Write a promotional offer caption for: ${c.name} (${c.category})`,
  }),
  flash_title: (c) => ({
    system: "Reply with ONLY the flash sale title. Max 60 chars, exciting, with emojis.",
    user: `Generate a flash sale title for: ${c.name}`,
  }),
  flash_description: (c) => ({
    system: "Reply with ONLY the flash sale description. 2-3 lines, urgent, exciting.",
    user: `Generate a flash sale promotional description for: ${c.name} (${c.category})`,
  }),
  review_summary: (c) => ({
    system: "You summarize customer reviews. Reply with a concise 3-4 sentence summary highlighting pros and common feedback.",
    user: `Summarize these customer reviews:\n${c.extra || "No reviews provided"}`,
  }),
  query_summary: (c) => ({
    system: "You analyze customer questions and produce a FAQ summary. Reply with 3-5 FAQ items in 'Q: ...\\nA: ...' format.",
    user: `Analyze these customer questions and produce FAQ summary:\n${c.extra || "No questions provided"}\nProduct: ${c.name}`,
  }),
};

interface Ctx {
  name: string;
  category: string;
  description?: string;
  extra?: string;
}

const cleanText = (value?: string, fallback = "Product") =>
  String(value || "").trim() || fallback;

const sentenceCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const buildFallbackContent = (task: Task, ctx: Ctx) => {
  const name = cleanText(ctx?.name);
  const category = cleanText(ctx?.category, "Fashion");
  const base = ctx?.description?.trim();
  const categoryLower = category.toLowerCase();

  const map: Record<Task, string> = {
    description_short: `${name} brings premium ${categoryLower} style with a clean look, comfortable feel, and everyday-ready finish.`,
    description_long: `${name} is designed for customers who want style, comfort, and reliable quality in one piece.\n\nThis ${categoryLower} item has a polished everyday look that works well for casual wear, outings, and gifting. The finish is easy to style and made to feel confident from day to night.\n\n${base ? `Key detail: ${base}\n\n` : ""}Add it to your wardrobe for a versatile Static Vibes look that feels modern, comfortable, and premium.`,
    description_seo: `${name} is a premium ${categoryLower} product from Static Vibes, made for customers in Bangladesh who want stylish, comfortable, and easy-to-wear fashion. It is perfect for everyday outfits, casual occasions, and gifting. Shop ${name} online with reliable quality, modern styling, and a clean fashion-forward look.`,
    title_enhance: `${name} | Premium ${category}`.slice(0, 70),
    title_variations: [`1. ${name} Premium ${category}`, `2. ${name} Casual ${category}`, `3. ${name} Modern Style`, `4. Static Vibes ${name}`, `5. ${name} Everyday Wear`].join("\n"),
    tags: [name, category, "static vibes", "premium", "fashion", "bangladesh", "casual", "stylish"].map((tag) => tag.toLowerCase()).join(", "),
    seo_title: `${name} | Static Vibes`.slice(0, 60),
    seo_meta: `Shop ${name} at Static Vibes Bangladesh. Premium ${categoryLower} with modern style, comfort, and reliable quality.`.slice(0, 160),
    seo_keywords: [name, category, `${category} Bangladesh`, "Static Vibes", "online fashion bd", "premium fashion", "casual wear"].join(", "),
    social_facebook: `✨ New drop alert!\n\n${name} is here with a premium ${categoryLower} look made for everyday style.\n\nOrder now from Static Vibes 🛒`,
    social_instagram: `Fresh fit, clean vibe ✨\n\n${name}\nPremium ${categoryLower} from Static Vibes.\n\n#staticvibes #bangladeshfashion #streetwearbd #fashionbd #onlineshoppingbd #newdrop`,
    social_promo: `🔥 Limited time drop! Grab ${name} now and upgrade your style with Static Vibes. Order before stock runs out!`,
    flash_title: `⚡ Flash Deal: ${name}`.slice(0, 60),
    flash_description: `Flash sale is live for ${name}!\nPremium ${categoryLower} style at a better deal.\nOrder now before stock ends.`,
    review_summary: `Customers are interested in ${name}'s style, comfort, and everyday usability. Common feedback highlights the product's premium look, easy styling, and value for money.`,
    query_summary: `Q: What is this product best for?\nA: ${name} is best for everyday casual styling and gifting.\n\nQ: Is it suitable for regular use?\nA: Yes, it is designed for comfortable daily wear.\n\nQ: How can I order?\nA: Add it to cart and complete checkout from Static Vibes.`,
  };

  return sentenceCase(map[task] || `${name} is a premium ${categoryLower} product from Static Vibes.`);
};

const fallbackResponse = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  task: Task,
  context: Ctx,
  message: string,
  details = "",
) => {
  await supabase.from("ai_generation_logs").insert({
    admin_id: userId,
    prompt_used: `${task}_fallback`,
    result_status: "fallback",
  });

  return jsonResponse({
    success: true,
    content: buildFallbackContent(task, context || ({} as Ctx)),
    task,
    fallback: true,
    message,
    details,
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) return errorResponse("AI is not configured on the server.", 500, "No AI key configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Unauthorized: please sign in again.", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return errorResponse("Unauthorized: your session expired. Please sign out and sign in again.", 401);

    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return errorResponse("Admin only: this account does not have permission to use AI content.", 403);

    const { task, context } = (await req.json()) as { task: Task; context: Ctx };
    const builder = PROMPTS[task];
    if (!builder) throw new Error(`Unknown task: ${task}`);

    const { system, user: userPrompt } = builder(context || ({} as Ctx));

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await readResponseText(aiRes);
      if (aiRes.status === 429) {
        return fallbackResponse(supabase, user.id, task, context, "AI is busy, so fallback content was generated.", errText);
      }
      if (aiRes.status === 402) {
        return fallbackResponse(supabase, user.id, task, context, "AI credits are exhausted, so fallback content was generated.", errText);
      }
      if (aiRes.status >= 500) {
        return fallbackResponse(supabase, user.id, task, context, "AI service is temporarily unavailable, so fallback content was generated.", errText);
      }
      console.error("[ai-content-assistant] AI gateway error", {
        status: aiRes.status,
        statusText: aiRes.statusText,
        body: errText.slice(0, 500),
      });
      return errorResponse(`AI gateway error (${aiRes.status})`, aiRes.status, errText);
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";

    // Log usage
    await supabase.from("ai_generation_logs").insert({
      admin_id: user.id,
      prompt_used: task,
      result_status: "success",
    });

    return jsonResponse({ success: true, content, task });
  } catch (e: any) {
    console.error("[ai-content-assistant] failed", {
      error: e,
      type: typeof e,
      constructor: e?.constructor?.name,
    });
    return errorResponse(e?.message || "Unknown error", 400);
  }
});
