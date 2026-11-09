import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendEmail } from "../_shared/resend.ts";
import { baseLayout, h1, p, btn, divider, BRAND } from "../_shared/email-template.ts";
import { requireAdmin } from "../_shared/auth.ts";

const LABELS: Record<string, { title: string; body: string }> = {
  processing: { title: "Order Processing", body: "We have received your order and are preparing it for shipment." },
  shipped: { title: "Order Shipped", body: "Great news — your order has shipped and is on its way." },
  out_for_delivery: { title: "Out For Delivery", body: "Your order is out for delivery and will arrive today." },
  delivered: { title: "Delivered", body: "Your order has been delivered. We hope you love it." },
  cancelled: { title: "Order Cancelled", body: "Your order has been cancelled. Reach out if this was unexpected." },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { orderId, customerEmail, customerName, status } = await req.json();
    if (!customerEmail || !status) throw new Error("email and status required");
    const meta = LABELS[status] ?? { title: `Order ${status}`, body: `Your order status has been updated to ${status}.` };
    const shortId = String(orderId).slice(0, 8).toUpperCase();
    const trackUrl = `${BRAND.url}/order-tracking?id=${orderId}`;

    const html = baseLayout({
      preheader: `${meta.title} — Order #${shortId}`,
      bodyHtml: `
        ${h1(meta.title)}
        ${p(`Hi <strong>${customerName ?? "there"}</strong>,`)}
        ${p(meta.body)}
        <div style="text-align:center;margin:24px 0;padding:16px;background:#fafafa;border:1px solid #ebebeb;">
          <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;">Order</div>
          <div style="font-family:monospace;font-size:16px;color:#000;margin-top:6px;font-weight:700;">#${shortId}</div>
        </div>
        ${btn(trackUrl, "Track Live")}
        ${divider}
        ${p(`<span style="color:#888;font-size:12px;">Need help? Reply to this email.</span>`)}
      `,
    });

    await sendEmail({
      to: customerEmail,
      subject: `${meta.title} · #${shortId}`,
      html,
      type: `order_${status}`,
      metadata: { orderId, status },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
