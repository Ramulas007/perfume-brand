import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmail } from "../_shared/resend.ts";
import { baseLayout, h1, p, btn, divider, BRAND } from "../_shared/email-template.ts";

// Per-email throttle to prevent spam relay
const hits = new Map<string, number>();
function throttled(email: string) {
  const now = Date.now();
  const last = hits.get(email) ?? 0;
  if (now - last < 60_000) return true;
  hits.set(email, now);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const ok = () =>
    new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  try {
    const { email, fullName } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ok();
    }
    const lower = email.toLowerCase();
    if (throttled(lower)) return ok();

    // Verify email belongs to a newly signed-up user (no prior sign-in)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = users?.users?.find((u) => u.email?.toLowerCase() === lower);
    if (!match) return ok();
    // Only send to brand-new accounts (no prior sign-in)
    if (match.last_sign_in_at) return ok();

    const firstName = (fullName ?? "").trim().split(" ")[0] || "there";

    const html = baseLayout({
      preheader: `Welcome to ${BRAND.name} — your premium streetwear destination`,
      bodyHtml: `
        ${h1(`Welcome, ${firstName}`)}
        ${p(`Thanks for joining <strong>${BRAND.name}</strong> — where premium streetwear meets uncompromising design. You are now part of a curated movement.`)}
        ${p(`Discover our latest drops, exclusive collections, and member-only releases.`)}
        ${btn(`${BRAND.url}/shop`, "Shop Collection")}
        ${divider}
        ${p(`<span style="color:#888;font-size:12px;">Follow us — stay vibing.</span>`)}
      `,
    });

    await sendEmail({
      to: email,
      subject: `Welcome to ${BRAND.name}`,
      html,
      type: "welcome",
      metadata: { fullName },
    });

    return ok();
  } catch {
    return ok();
  }
});
