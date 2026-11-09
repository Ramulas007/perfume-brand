# Priority #2 — Category, Variants & Product Management

## 1. Database Migration

**`products` table — add columns:**
- `stock_quantity` (int, default 0)
- `low_stock_threshold` (int, default 5)
- `badge_text` (text, nullable) — e.g. "Eid Collection"
- `badge_color` (text, default '#8B0000')
- `enable_sizes` (bool, default false)
- `enable_colors` (bool, default false)
- `enable_volumes` (bool, default false)

**New table — `product_variants`:**
- `id`, `product_id` (FK→products), `variant_type` ('size'|'color'|'volume'), `value` (text, e.g. "XL", "Red", "5ml")
- `price` (numeric, nullable — overrides product price)
- `sale_price` (numeric, nullable)
- `stock_quantity` (int, default 0)
- `image_urls` (text[], nullable) — variant-specific images
- `display_order` (int)
- `color_hex` (text, nullable — for color swatches)
- RLS: admins manage, public read. GRANTs for anon/authenticated/service_role.

**`categories` table** — already has `parent_id`. No schema change.

## 2. Category System (Frontend)

**Homepage (`Index.tsx` + `CategoryProductRow`):**
- Show only main categories (parent_id IS NULL).
- For each main category, aggregate products where `category_id` is the main cat OR any of its subcategory ids.

**Category page (`/category/:slug`):**
- Detect if main category → show sub-category chip row at top.
- Default: show products from all sub-categories.
- Click chip → filter to that sub-category only.
- Sub-category direct URL still works.

## 3. Product Variants (Frontend)

**Product Detail (`ProductDetail.tsx`):**
- Fetch variants from `product_variants`.
- Group by type (size/color/volume).
- Selecting a color/volume variant with `image_urls` → swap main gallery.
- Selected variant's price/sale_price/stock overrides product defaults.
- Add-to-cart uses variant id + value.

**Predefined options pickers** (in admin form):
- Colors: Black/White/Red/Blue/Green/Yellow/Gray/Brown/Purple + custom
- Sizes: XS/S/M/L/XL/XXL + custom
- Volumes: 3ml/5ml/10ml/30ml/50ml/100ml + custom

## 4. Admin — Product Form (`AdminProducts.tsx`)

- 3 toggles: Enable Sizes, Enable Colors, Enable Volumes
- Variant editor table (rows: type, value, price, sale_price, stock, images, color_hex)
- Stock quantity + auto status display (In/Low/Out)
- Badge text + color picker
- Auto discount % from original_price vs price (display only, no manual entry)
- **Duplicate button** per row → clones product + variants → opens edit modal
- **Bulk upload modal:**
  - Multi-image upload to `products` bucket
  - Shared: description, category, price, variants config
  - Filename (without ext) → product name
  - Batch INSERT

## 5. Product Card

- Auto-render OFF badge if `original_price > price`
- Auto "NEW" badge if product in latest 5 (ordered by `created_at` DESC)
- Custom `badge_text` rendered with `badge_color`
- Hover: scale + secondary image swap (if `supplementary_images[0]` exists)
- Consistent rounded corners (image + card same radius)

## 6. Files Touched

**New migration:** adds columns + `product_variants` table + GRANTs + RLS.

**Edited:**
- `src/hooks/useProducts.ts` — fetch variants, expose aggregated-by-parent helper
- `src/pages/Index.tsx` / `CategoryProductRow.tsx` — main-cat aggregation
- `src/pages/Shop.tsx` or category route — sub-cat chips + filter
- `src/pages/ProductDetail.tsx` — variant selectors + image swap + dynamic price
- `src/components/ProductCard.tsx` + `LatestPosterCard.tsx` — badges, hover swap
- `src/pages/admin/AdminProducts.tsx` — toggles, variants editor, stock, badges, duplicate, bulk upload
- `src/types/product.ts` — variant types

## 7. Out of Scope (this update)

- Variant-level cart line items beyond storing selected size/color/volume (cart schema unchanged)
- Sub-sub categories (only 2 levels)
- Image filename → product name parsing edge cases beyond basic slug→title

## 8. Verification

- Migration runs cleanly
- Admin can create product with 3 size variants having different prices
- Selecting variant on product page swaps image + updates price
- Homepage Mens section shows products from all Mens subcategories
- Stock = 0 → Out of Stock badge auto-shows
- Duplicate creates exact copy as new row
- Bulk upload creates N products from N images
