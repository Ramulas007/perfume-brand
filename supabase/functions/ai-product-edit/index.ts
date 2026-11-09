// Edit an existing product using an admin's natural-language prompt.
// Returns a JSON patch of allowed fields to update.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, "Content-Type": "application/json" },
  });

const err = (message: string, status = 400, details = "") =>
  json({ success: false, message, error: message, details }, status);

// Whitelist of fields the AI may modify.
const ALLOWED_FIELDS = [
  "name",
  "description",
  "price",
  "original_price",
  "discount",
  "sku",
  "in_stock",
  "stock_quantity",
  "low_stock_threshold",
  "badge_text",
  "badge_color",
  "badge_type",
  "colors",
  "sizes",
] as const;

interface ReqBody {
  productId: string;
  prompt: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) return err("AI is not configured on the server.", 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return err("Unauthorized: please sign in again.", 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return err("Unauthorized: session expired.", 401);

    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return err("Admin only.", 403);

    const body = (await req.json()) as ReqBody;
    if (!body.productId || !body.prompt?.trim()) {
      return err("productId and prompt are required.", 400);
    }

    const { data: product, error: pErr } = await admin
      .from("products").select("*").eq("id", body.productId).maybeSingle();
    if (pErr || !product) return err("Product not found.", 404);

    // Only send the whitelisted fields to the model.
    const current: Record<string, unknown> = {};
    for (const f of ALLOWED_FIELDS) current[f] = (product as any)[f] ?? null;

    const system = `You are an e-commerce product editor for "Static Vibes" (Bangladeshi streetwear).
The admin will give you a natural-language instruction (may be in Bangla/Banglish/English).
You will modify the product fields accordingly and return ONLY strict JSON.

Rules:
- Return ONLY the fields you actually change. Do NOT include unchanged fields.
- Never invent fields outside the allowed whitelist.
- Prices are BDT numbers (integers or decimals). If admin says "10% off", compute discount and adjust price/original_price accordingly.
- Product NAME must be SHORT — maximum 3 words, under 40 chars. Never write long descriptive names. Good: "Midnight Tiger Tee", "Neon Skull Hoodie". Bad: "Premium Cotton Oversized Urban Graphic T-Shirt".
- For colors/sizes return string arrays.
- If the instruction is unclear or unsafe, return {} (empty JSON object).
- Output STRICT JSON. No markdown fences, no prose.`;

    const userText = `Allowed fields (whitelist): ${ALLOWED_FIELDS.join(", ")}

Current product values:
${JSON.stringify(current, null, 2)}

Admin instruction:
"""
${body.prompt.trim()}
"""

Return JSON object with ONLY the changed fields.`;

    const useGemini = !!GEMINI_API_KEY;
    const aiUrl = useGemini
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (useGemini) aiHeaders["Authorization"] = `Bearer ${GEMINI_API_KEY}`;
    else aiHeaders["Lovable-API-Key"] = LOVABLE_API_KEY!;
    const modelName = useGemini ? "gemini-2.5-flash" : "google/gemini-2.5-flash";

    const aiRes = await fetch(aiUrl, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text().catch(() => "");
      if (aiRes.status === 429) return err("AI is busy, please try again in a moment.", 429, t.slice(0, 500));
      if (aiRes.status === 402) return err("AI credits exhausted.", 402, t.slice(0, 500));
      return err(`AI gateway error (${aiRes.status})`, aiRes.status, t.slice(0, 500));
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // Filter to whitelist + basic type coercion
    const patch: Record<string, unknown> = {};
    for (const f of ALLOWED_FIELDS) {
      if (!(f in parsed)) continue;
      let v: any = (parsed as any)[f];
      if (v === undefined) continue;
      if (["price", "original_price", "discount", "stock_quantity", "low_stock_threshold"].includes(f)) {
        if (v === null || v === "") { patch[f] = null; continue; }
        const n = Number(v);
        if (!Number.isFinite(n)) continue;
        patch[f] = n;
      } else if (f === "in_stock") {
        patch[f] = Boolean(v);
      } else if (f === "colors" || f === "sizes") {
        if (Array.isArray(v)) patch[f] = v.map((x: any) => String(x)).filter(Boolean);
      } else {
        let s = v === null ? null : String(v);
        if (f === "name" && s) {
          const words = s.trim().split(/\s+/);
          if (words.length > 3) s = words.slice(0, 3).join(" ");
        }
        patch[f] = s;
      }
    }

    if (Object.keys(patch).length === 0) {
      return json({ success: false, message: "AI did not return any changes. Try a more specific instruction.", patch: {} });
    }

    const { data: updated, error: uErr } = await admin
      .from("products").update(patch).eq("id", body.productId).select().single();
    if (uErr) return err(`Update failed: ${uErr.message}`, 400);

    await admin.from("ai_generation_logs").insert({
      admin_id: user.id,
      prompt_used: `product_edit: ${body.prompt.trim().slice(0, 200)}`,
      result_status: "success",
    });

    return json({ success: true, patch, product: updated });
  } catch (e: any) {
    console.error("[ai-product-edit] failed", e);
    return err(e?.message || "Unknown error", 400);
  }
});
