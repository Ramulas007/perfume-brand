// Runs before vite dev/build via predev/prebuild; writes public/sitemap.xml.
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://staticvibes.site";

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/customize", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/order-tracking", changefreq: "monthly", priority: "0.5" },
  { path: "/wishlist", changefreq: "monthly", priority: "0.4" },
  { path: "/return-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
];

async function fetchDynamic(): Promise<Entry[]> {
  const catalogPath = resolve("public/perfumes/catalog.json");
  if (process.env.VITE_PERFUME_CATALOG === "true" || existsSync(catalogPath)) {
    if (!existsSync(catalogPath)) {
      throw new Error(`Local perfume catalog not found at ${catalogPath}`);
    }
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown[];
    return catalog.map((_, index) => ({
      path: `/product/perfume-${index + 1}`,
      changefreq: "weekly",
      priority: "0.7",
    }));
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const sb = createClient(url, key);
    const [{ data: products }, { data: cats }] = await Promise.all([
      sb.from("products").select("id, updated_at"),
      sb.from("categories").select("slug"),
    ]);
    const productEntries = (products || []).map((p: any) => ({
      path: `/product/${p.id}`,
      changefreq: "weekly",
      priority: "0.7",
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
    }));
    const catEntries = (cats || [])
      .filter((c: any) => c.slug && c.slug !== "custom-products")
      .map((c: any) => ({ path: `/category/${c.slug}`, changefreq: "weekly", priority: "0.8" }));
    return [...catEntries, ...productEntries];
  } catch {
    return [];
  }
}

function render(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

(async () => {
  const dynamic = await fetchDynamic();
  const entries = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
