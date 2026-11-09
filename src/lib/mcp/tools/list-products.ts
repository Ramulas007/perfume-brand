import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List products from the Static Vibes catalog. Optionally filter by search term and in-stock status.",
  inputSchema: {
    search: z.string().optional().describe("Case-insensitive substring to match against product name."),
    in_stock_only: z.boolean().optional().describe("If true, only return in-stock products."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, in_stock_only, limit }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = supabase
      .from("products")
      .select("id, name, price, original_price, in_stock, image_url, category_id")
      .limit(limit ?? 20);
    if (in_stock_only) q = q.eq("in_stock", true);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { products: data },
    };
  },
});
