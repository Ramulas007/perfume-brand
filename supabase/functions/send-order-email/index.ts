import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmail } from "../_shared/resend.ts";
import { baseLayout, h1, p, btn, divider, BRAND } from "../_shared/email-template.ts";
import { requireUser } from "../_shared/auth.ts";

interface Item {
  product_name: string;
  quantity: number;
  price: number;
  selected_size?: string;
  selected_color?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      orderId, customerEmail, customerName,
      orderItems = [] as Item[],
      totalAmount = 0, shippingCost = 0, discountAmount = 0,
      paymentMethod, deliveryArea, address, city, phone,
    } = body;

    if (!customerEmail || !orderId) {
      return new Response(JSON.stringify({ success: false, message: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller: must own order OR be admin OR (guest order with matching email)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: order } = await admin
      .from("orders")
      .select("id,user_id,email")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) {
      return new Response(JSON.stringify({ success: false, message: "order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await requireUser(req);
    const isOwner = user && order.user_id === user.id;
    const isGuestMatch = !order.user_id && order.email && order.email.toLowerCase() === String(customerEmail).toLowerCase();
    if (!isOwner && !isGuestMatch) {
      // Also allow admin
      let isAdmin = false;
      if (user) {
        const { data: r } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        isAdmin = !!r;
      }
      if (!isAdmin) {
        return new Response(JSON.stringify({ success: false, message: "unauthorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Force email recipient to the order's stored email (prevents spoofing)
    const recipientEmail = order.email || customerEmail;

    const subTotal = orderItems.reduce((s: number, i: Item) => s + i.price * i.quantity, 0);
    const shortId = String(orderId).slice(0, 8).toUpperCase();
    const eta = new Date(Date.now() + 4 * 86400000).toDateString();
    const trackUrl = `${BRAND.url}/order-tracking?id=${orderId}`;

    const itemsRows = orderItems.map((i: Item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #ebebeb;font-size:13px;color:#000;">
          <div style="font-weight:600;letter-spacing:0.5px;">${i.product_name}</div>
          <div style="color:#888;font-size:11px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">
            ${i.selected_size ? `Size ${i.selected_size}` : ""}${i.selected_color ? ` · ${i.selected_color}` : ""} · Qty ${i.quantity}
          </div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #ebebeb;text-align:right;font-size:13px;color:#000;font-weight:600;">৳${i.price * i.quantity}</td>
      </tr>`).join("");

    const html = baseLayout({
      preheader: `Order #${shortId} confirmed`,
      bodyHtml: `
        ${h1("Order Confirmed")}
        ${p(`Hi <strong>${customerName}</strong>, thank you for your order. We are preparing it now.`)}
        <div style="text-align:center;margin:24px 0;padding:16px;background:#fafafa;border:1px solid #ebebeb;">
          <div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;">Order ID</div>
          <div style="font-family:monospace;font-size:16px;color:#000;margin-top:6px;font-weight:700;">#${shortId}</div>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">
          ${itemsRows}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:13px;color:#444;">
          <tr><td>Subtotal</td><td align="right">৳${subTotal}</td></tr>
          ${discountAmount ? `<tr><td>Discount</td><td align="right">−৳${discountAmount}</td></tr>` : ""}
          <tr><td>Shipping</td><td align="right">৳${shippingCost}</td></tr>
          <tr><td style="padding-top:12px;border-top:2px solid #000;font-weight:700;color:#000;font-size:15px;letter-spacing:1px;">TOTAL</td>
              <td align="right" style="padding-top:12px;border-top:2px solid #000;font-weight:700;color:#000;font-size:15px;">৳${totalAmount}</td></tr>
        </table>
        ${divider}
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#000;font-weight:700;margin-bottom:10px;">Shipping To</div>
        ${p(`${customerName}<br>${address}, ${city}<br>${phone}<br><span style="color:#888;">${deliveryArea === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"} · ${paymentMethod?.toUpperCase()}</span>`)}
        ${p(`<span style="color:#888;font-size:12px;">Estimated delivery: <strong>${eta}</strong></span>`)}
        ${btn(trackUrl, "Track Order")}
      `,
    });

    await sendEmail({
      to: recipientEmail,
      subject: `Order Confirmed · #${shortId}`,
      html,
      type: "order_confirmation",
      metadata: { orderId, totalAmount },
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
