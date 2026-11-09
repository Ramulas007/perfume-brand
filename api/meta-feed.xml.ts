// Vercel Serverless Function: Meta (Facebook/Instagram) Catalog RSS 2.0 Feed
// Endpoint: /api/meta-feed.xml
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://hhzcoijhvvlmtazlmiei.supabase.co';

const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoemNvaWpodnZsbXRhemxtaWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDU0OTEsImV4cCI6MjA5MjcyMTQ5MX0.TPDIuIfAPMIb7vC6Qw8P0y--xUTWKXPjzQwkUiWjHV0';

const SITE_URL = (process.env.SITE_URL || 'https://staticvibes.site').replace(/\/$/, '');
const BRAND = process.env.BRAND_NAME || 'Static Vibes';
const CURRENCY = 'BDT';

// Map our category names → Google Product Taxonomy
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  't-shirts': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'tshirts': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'tees': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'shirts': 'Apparel & Accessories > Clothing > Shirts & Tops',
  'hoodies': 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'jackets': 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'pants': 'Apparel & Accessories > Clothing > Pants',
  'trousers': 'Apparel & Accessories > Clothing > Pants',
  'pajamas': 'Apparel & Accessories > Clothing > Sleepwear & Loungewear',
  'accessories': 'Apparel & Accessories > Clothing Accessories',
  'caps': 'Apparel & Accessories > Clothing Accessories > Hats',
  'belts': 'Apparel & Accessories > Clothing Accessories > Belts',
  'sunglasses': 'Apparel & Accessories > Clothing Accessories > Sunglasses',
  'posters': 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork',
};
const DEFAULT_GOOGLE_CATEGORY = 'Apparel & Accessories > Clothing';

function escapeXml(s: string): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(s: string): string {
  return (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Reject placeholders and any non-HTTPS / non-publicly-reachable images.
function isValidProductImage(url: string | null | undefined): url is string {
  if (!url) return false;
  const u = url.trim();
  if (!/^https:\/\//i.test(u)) return false;
  if (/placeholder/i.test(u)) return false;
  if (/\/placeholder\.svg$/i.test(u)) return false;
  return true;
}

function buildTitle(name: string, categoryName?: string): string {
  const base = (name || '').trim();
  // Meta hard limit 150; aim for 70–150 with brand prefix.
  const withBrand = base.toLowerCase().includes(BRAND.toLowerCase())
    ? base
    : `${base} | ${BRAND}`;
  return withBrand.slice(0, 150);
}

function buildDescription(p: any, categoryName?: string): string {
  const raw = stripHtml(p.description || '');
  const parts: string[] = [];
  if (raw) parts.push(raw);
  else parts.push(`${p.name} — premium quality from ${BRAND}.`);
  if (categoryName) parts.push(`Category: ${categoryName}.`);
  if (Array.isArray(p.sizes) && p.sizes.length) parts.push(`Available sizes: ${p.sizes.join(', ')}.`);
  if (Array.isArray(p.colors) && p.colors.length) parts.push(`Colors: ${p.colors.join(', ')}.`);
  parts.push('Cash on Delivery available across Bangladesh.');
  const joined = parts.join(' ');
  // Meta allows up to 9999 chars; keep it tight for ad relevance.
  return joined.length > 4900 ? joined.slice(0, 4900) : joined;
}

function mapGoogleCategory(categoryName?: string): string {
  if (!categoryName) return DEFAULT_GOOGLE_CATEGORY;
  const key = categoryName.toLowerCase().trim();
  if (GOOGLE_CATEGORY_MAP[key]) return GOOGLE_CATEGORY_MAP[key];
  for (const k of Object.keys(GOOGLE_CATEGORY_MAP)) {
    if (key.includes(k)) return GOOGLE_CATEGORY_MAP[k];
  }
  return DEFAULT_GOOGLE_CATEGORY;
}

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: products, error } = await supabase
      .from('products')
      .select(
        'id, name, description, price, original_price, image_url, supplementary_images, in_stock, category_id, sku, sizes, colors'
      )
      .eq('in_stock', true)
      .limit(10000);

    if (error) throw error;

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug');
    const catMap = new Map(
      (categories || []).map((c: any) => [c.id, { name: c.name, slug: c.slug }])
    );

    const skipped: { id: string; reason: string }[] = [];
    const items: string[] = [];

    for (const p of products || []) {
      if (!p.price || Number(p.price) <= 0) {
        skipped.push({ id: p.id, reason: 'missing/invalid price' });
        continue;
      }
      if (!isValidProductImage(p.image_url)) {
        skipped.push({ id: p.id, reason: 'placeholder or invalid image' });
        continue;
      }

      const cat = catMap.get(p.category_id) as { name: string; slug: string } | undefined;
      const slug = slugify(p.name) || p.id;
      // Route is /product/:id — keep id as the canonical param so the page resolves;
      // the slug is appended as a SEO suffix that the router ignores after the id segment.
      // To keep links valid we use `/product/{id}?slug={slug}` style: actually router uses :id,
      // so we use `/product/{id}` and add slug only via canonical-friendly path segment.
      const link = `${SITE_URL}/product/${p.id}`;

      const title = buildTitle(p.name, cat?.name);
      const description = buildDescription(p, cat?.name);
      const price = `${Number(p.price).toFixed(2)} ${CURRENCY}`;
      const salePrice =
        p.original_price && Number(p.original_price) > Number(p.price)
          ? `${Number(p.price).toFixed(2)} ${CURRENCY}`
          : null;
      const regularPrice =
        p.original_price && Number(p.original_price) > Number(p.price)
          ? `${Number(p.original_price).toFixed(2)} ${CURRENCY}`
          : price;
      const googleCat = mapGoogleCategory(cat?.name);

      // Up to 10 additional images allowed by Meta
      const additional = (Array.isArray(p.supplementary_images) ? p.supplementary_images : [])
        .filter(isValidProductImage)
        .slice(0, 10)
        .map((u: string) => `      <g:additional_image_link>${escapeXml(u)}</g:additional_image_link>`)
        .join('\n');

      items.push(`    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(p.image_url)}</g:image_link>
${additional ? additional + '\n' : ''}      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>${regularPrice}</g:price>${
        salePrice ? `\n      <g:sale_price>${salePrice}</g:sale_price>` : ''
      }
      <g:brand>${escapeXml(BRAND)}</g:brand>
      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>
      <g:product_type>${escapeXml(cat?.name || 'Apparel')}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>${
        p.sku ? `\n      <g:mpn>${escapeXml(p.sku)}</g:mpn>` : ''
      }
      <g:item_group_id>${escapeXml(p.id)}</g:item_group_id>
      <g:shipping>
        <g:country>BD</g:country>
        <g:service>Standard</g:service>
        <g:price>80.00 ${CURRENCY}</g:price>
      </g:shipping>
    </item>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(BRAND)} Product Feed</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Meta Commerce product catalog feed for ${escapeXml(BRAND)}</description>
${items.join('\n')}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Feed-Items', String(items.length));
    res.setHeader('X-Feed-Skipped', String(skipped.length));
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('meta-feed error:', err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<error><message>${escapeXml(
        err?.message || 'Internal error'
      )}</message></error>`
    );
  }
}
