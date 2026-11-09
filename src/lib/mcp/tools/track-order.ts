import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "track_order",
  title: "Track order",
  description: "Look up an order's status by order ID or customer phone number.",
  inputSchema: {
    order_id: z.string().optional().describe("Order ID (e.g. LCB-YYYY-XXXX or UUID)."),
    phone: z.string().optional().describe("Customer phone number used at checkout."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id, phone }) => {
    if (!order_id && !phone) {
      return { content: [{ type: "text", text: "Provide order_id or phone." }], isError: true };
    }
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase
      .from("orders")
      .select("id, order_number, status, total, customer_name, customer_phone, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (order_id) q = q.or(`id.eq.${order_id},order_number.eq.${order_id}`);
    if (phone) q = q.eq("customer_phone", phone);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { orders: data },
    };
  },
});
