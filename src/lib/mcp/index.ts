import { defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";
import trackOrder from "./tools/track-order";

export default defineMcp({
  name: "static-vibes-mcp",
  title: "Static Vibes MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Static Vibes storefront. Use `list_products` to browse the catalog, `get_product` for full details of one product, and `track_order` to look up order status by order ID or customer phone.",
  tools: [listProducts, getProduct, trackOrder],
});
