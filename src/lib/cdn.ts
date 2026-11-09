// Branded CDN helper for media URLs.
//
// Strategy: a Vercel rewrite (see vercel.json) proxies
//   https://staticvibes.site/cdn/<bucket>/<path>
// to
//   https://hhzcoijhvvlmtazlmiei.supabase.co/storage/v1/object/public/<bucket>/<path>
//
// So in the browser we rewrite Supabase public-storage URLs to the
// `/cdn/...` path. We only do this on hosts where the Vercel rewrite is
// actually deployed (the production custom domain). On Lovable preview
// hosts, Supabase preview, etc. we keep the original URL so images don't
// break.

export const CDN_PATH_PREFIX = "/cdn";
export const IMG_PATH_PREFIX = "/img";

// Hosts where the /cdn and /img proxy rewrites are live.
const CDN_ENABLED_HOSTS = new Set([
  "staticvibes.site",
  "www.staticvibes.site",
]);

// Matches: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
const SUPABASE_PUBLIC_RE =
  /^https?:\/\/[a-z0-9-]+\.supabase\.(?:co|in)\/storage\/v1\/object\/public\//i;

function cdnEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return CDN_ENABLED_HOSTS.has(window.location.hostname);
}

/**
 * Rewrite a Supabase public storage URL to the branded /cdn proxy path
 * when running on a host where the Vercel rewrite is deployed.
 * Returns the original URL everywhere else so nothing ever breaks.
 */
export function toCdnUrl(url?: string | null): string {
  if (!url) return "";
  if (!SUPABASE_PUBLIC_RE.test(url)) return url;
  if (!cdnEnabled()) return url;
  return url.replace(SUPABASE_PUBLIC_RE, `${CDN_PATH_PREFIX}/`);
}

/**
 * Rewrite a Supabase public storage URL to the on-the-fly image
 * transformation proxy (`/img/...` -> Supabase render endpoint) so
 * we can serve resized + webp variants instead of multi-MB originals.
 * Only kicks in on production hosts; everywhere else returns "".
 */
export function toImgUrl(
  url?: string | null,
  opts?: { width?: number; quality?: number; format?: "webp" | "avif" | "origin" }
): string {
  if (!url) return "";
  if (!cdnEnabled()) return "";
  if (!SUPABASE_PUBLIC_RE.test(url)) return "";
  const base = url.replace(SUPABASE_PUBLIC_RE, `${IMG_PATH_PREFIX}/`);
  const params = new URLSearchParams();
  if (opts?.width) params.set("width", String(Math.round(opts.width)));
  if (opts?.quality) params.set("quality", String(opts.quality));
  params.set("format", opts?.format || "webp");
  // Ensure the transformer preserves aspect ratio instead of cropping
  // (Supabase's default `resize` mode is `cover`, which crops the sides
  // when only width is provided and the source aspect ratio differs).
  params.set("resize", "contain");
  return `${base}?${params.toString()}`;
}

/**
 * Given a /cdn/... path or full branded URL, return the underlying
 * Supabase Storage URL. Used as a fallback when the proxy 404s.
 */
const SUPABASE_PROJECT_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  "https://hhzcoijhvvlmtazlmiei.supabase.co";

export function toOriginUrl(url?: string | null): string {
  if (!url) return "";
  // Absolute branded URL: https://staticvibes.site/cdn/<rest>
  const absMatch = url.match(/^https?:\/\/[^/]+\/cdn\/(.+)$/i);
  if (absMatch) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${absMatch[1]}`;
  }
  // Relative path: /cdn/<rest>
  if (url.startsWith(`${CDN_PATH_PREFIX}/`)) {
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${url.slice(CDN_PATH_PREFIX.length + 1)}`;
  }
  return url;
}

/**
 * SEO-friendly slug: lowercase, hyphenated, ascii-safe.
 */
export function slugify(input: string): string {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
}

/**
 * Build a slug-based storage file name with a short uniqueness suffix.
 */
export function brandedFileName(name: string, ext?: string): string {
  const base = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 8);
  const cleanExt = (ext || "").replace(/^\./, "").toLowerCase() || "bin";
  return `${base}-${suffix}.${cleanExt}`;
}

export function extFromFile(file: { name: string }): string {
  const m = /\.([a-z0-9]+)$/i.exec(file.name);
  return m ? m[1].toLowerCase() : "bin";
}
