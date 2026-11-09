# Meta (Facebook & Instagram) Catalog Integration

Endpoint: **`https://staticvibes.site/api/meta-feed.xml`**

## What it does
- Vercel serverless function at `api/meta-feed.xml.ts`
- Fetches all in-stock products from Supabase
- Returns RSS 2.0 XML feed compatible with Meta Commerce Manager
- Auto-revalidates hourly (CDN cache: `s-maxage=3600, stale-while-revalidate=86400`)

## Fields returned per product
`id, title, description, link, image_link, availability, condition, price (BDT), brand, google_product_category`

Product URL format: `https://staticvibes.site/product/{id}` (matches the `/product/:id` route).

## Environment variables (optional)
Set in **Vercel → Project → Settings → Environment Variables**:

| Variable | Default | Purpose |
|---|---|---|
| `SITE_URL` | `https://staticvibes.site` | Base URL used in product links |
| `BRAND_NAME` | `Static Vibes` | Brand value sent to Meta |
| `VITE_SUPABASE_URL` | from `.env` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | from `.env` | Supabase anon key |

These already exist for the frontend, so no extra setup is required.

## Submit to Meta Commerce Manager

1. Open **Commerce Manager → Catalog → Data Sources → Add Products → Use Data Feed**.
2. Choose **Scheduled Feed**.
3. Paste this URL:
   ```
   https://staticvibes.site/api/meta-feed.xml
   ```
4. Set update frequency to **Hourly** (or Daily).
5. Currency: **BDT**.
6. Save. Meta will fetch and validate the feed.

## Auto updates
- The feed is generated live on request from Supabase, so any new product, price change, or stock update appears within the next Meta scheduled fetch.
- Vercel edge cache refreshes every hour automatically.

## Local test
```
curl https://staticvibes.site/api/meta-feed.xml | head -50
```

## Troubleshooting
- **Empty feed**: ensure products have `in_stock = true`, a `price`, and an `image_url`.
- **500 error**: check Vercel function logs; usually a Supabase env-var issue.
- **Meta rejects items**: image must be publicly reachable HTTPS and ≥ 500×500 px recommended.
