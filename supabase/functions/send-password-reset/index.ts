import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmail } from "../_shared/resend.ts";
import { baseLayout, h1, p, divider, BRAND } from "../_shared/email-template.ts";

// Naive in-memory throttle (per-instance). 5 req / 10 min per IP+email.
const hits = new Map<string, number[]>();
function throttle(key: string, limit = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  // Always respond success to prevent email enumeration
  const ok = () =>
    new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ok();
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (throttle(`${ip}:${email.toLowerCase()}`)) return ok();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (error || !data?.properties?.email_otp) return ok();
    const otp = data.properties.email_otp;

    const html = baseLayout({
      preheader: "Your Static Vibes password reset code",
      bodyHtml: `
        ${h1("Password Reset Code")}
        ${p("Use the 6-digit code below to reset your password. This code expires in 1 hour.")}
        <div style="text-align:center;margin:32px 0;">
          <div style="display:inline-block;padding:20px 36px;background:#000;color:#fff;font-size:32px;letter-spacing:12px;font-weight:700;font-family:'Courier New',monospace;border-radius:4px;">
            ${otp}
          </div>
        </div>
        ${p("Enter this code on the password reset page along with your new password.")}
        ${divider}
        ${p(`<span style="color:#888;font-size:12px;">If you did not request this, you can safely ignore this email. Your account stays secure.</span>`)}
      `,
    });

    await sendEmail({
      to: email,
      subject: `Your ${BRAND.name} reset code: ${otp}`,
      html,
      type: "password_reset",
    });

    return ok();
  } catch {
    return ok();
  }
});
