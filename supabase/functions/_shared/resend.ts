// Resend send helper via Lovable connector gateway + email logging

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_DEFAULT = "Static Vibes <no-reply@staticvibes.site>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  type: string;
  from?: string;
  metadata?: Record<string, unknown>;
}) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let status = "sent";
  let providerId: string | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: opts.from ?? FROM_DEFAULT,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      status = "failed";
      errorMessage = data?.message || JSON.stringify(data);
      throw new Error(`Resend [${res.status}]: ${errorMessage}`);
    }
    providerId = data?.id ?? null;
    return data;
  } catch (e) {
    if (status === "sent") {
      status = "failed";
      errorMessage = e instanceof Error ? e.message : String(e);
    }
    throw e;
  } finally {
    await supabase.from("email_logs").insert({
      email_type: opts.type,
      recipient: opts.to,
      subject: opts.subject,
      status,
      provider_id: providerId,
      error_message: errorMessage,
      metadata: opts.metadata ?? {},
    });
  }
}
