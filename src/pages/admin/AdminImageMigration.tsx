import { useState } from 'react';
import { Loader2, Play, CheckCircle2, AlertCircle, ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { toCdnUrl } from '@/lib/cdn';

/**
 * One-off migration tool: walks through DB rows that hold image URLs,
 * downloads each non-WebP image, re-encodes it to WebP, uploads next to
 * the original file, and rewrites the DB reference to the new URL.
 */

type TargetKind =
  | 'product_main'
  | 'product_supplementary'
  | 'banner'
  | 'category_image'
  | 'category_section_banner'
  | 'showcase';

interface Target {
  kind: TargetKind;
  rowId: string;
  url: string;
  index?: number; // for arrays
}

const OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  fileType: 'image/webp' as const,
  useWebWorker: true,
  initialQuality: 0.85,
};

const bucketFor = (kind: TargetKind): string => {
  if (kind === 'banner' || kind.startsWith('category') || kind === 'showcase') return 'banners';
  return 'products';
};

const isConvertible = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.webp')) return false;
  if (clean.endsWith('.svg')) return false;
  return /\.(jpe?g|png|gif|bmp|tiff?|heic|avif)$/.test(clean);
};

// Extract "products/xxx.jpg" style key from a Supabase public URL.
const extractStorageKey = (url: string, bucket: string): string | null => {
  try {
    const u = new URL(url, window.location.origin);
    const pathname = u.pathname;
    // patterns: /storage/v1/object/public/<bucket>/<key>   or   /cdn/<bucket>/<key>
    const patterns = [
      new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`),
      new RegExp(`/cdn/${bucket}/(.+)$`),
      new RegExp(`/${bucket}/(.+)$`),
    ];
    for (const re of patterns) {
      const m = pathname.match(re);
      if (m) return decodeURIComponent(m[1]);
    }
    return null;
  } catch {
    return null;
  }
};

const AdminImageMigration = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [done, setDone] = useState<number>(0);
  const [failed, setFailed] = useState<{ target: Target; reason: string }[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((l) => [...l.slice(-200), `${new Date().toLocaleTimeString()} — ${msg}`]);

  const scan = async () => {
    setScanning(true);
    setTargets([]);
    setDone(0);
    setFailed([]);
    setLog([]);
    try {
      const list: Target[] = [];

      // Products (main + supplementary)
      const { data: products } = await supabase
        .from('products').select('id, image_url, supplementary_images');
      (products || []).forEach((p: any) => {
        if (isConvertible(p.image_url)) list.push({ kind: 'product_main', rowId: p.id, url: p.image_url });
        (p.supplementary_images || []).forEach((u: string, i: number) => {
          if (isConvertible(u)) list.push({ kind: 'product_supplementary', rowId: p.id, url: u, index: i });
        });
      });

      // Banners
      const { data: banners } = await supabase.from('banners').select('id, image_url');
      (banners || []).forEach((b: any) => {
        if (isConvertible(b.image_url)) list.push({ kind: 'banner', rowId: b.id, url: b.image_url });
      });

      // Categories
      const { data: cats } = await supabase.from('categories').select('id, image_url, section_banner_url');
      (cats || []).forEach((c: any) => {
        if (isConvertible(c.image_url)) list.push({ kind: 'category_image', rowId: c.id, url: c.image_url });
        if (isConvertible(c.section_banner_url)) list.push({ kind: 'category_section_banner', rowId: c.id, url: c.section_banner_url });
      });

      // Showcase
      const { data: shows } = await supabase.from('latest_showcase').select('id, image_url');
      (shows || []).forEach((s: any) => {
        if (isConvertible(s.image_url)) list.push({ kind: 'showcase', rowId: s.id, url: s.image_url });
      });

      // Note: site_settings uses key/value JSONB — skipped here.
      // Re-upload the logo/favicon from Admin → Settings once and it will be saved as WebP automatically.

      setTargets(list);
      addLog(`Scan complete — ${list.length} image(s) need conversion.`);
      toast({ title: 'Scan complete', description: `${list.length} image(s) to convert.` });
    } catch (e: any) {
      toast({ title: 'Scan failed', description: e.message, variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const convertOne = async (t: Target): Promise<string> => {
    const bucket = bucketFor(t.kind);
    // Fetch original bytes
    const res = await fetch(t.url, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const blob = await res.blob();
    const originalFile = new File([blob], 'original', { type: blob.type || 'image/jpeg' });

    // Convert
    const webpBlob = await imageCompression(originalFile, OPTIONS);

    // Build new key
    const oldKey = extractStorageKey(t.url, bucket);
    const base = (oldKey || `converted/${Date.now()}`).replace(/\.[^./]+$/, '');
    const newKey = `${base}.webp`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(newKey, webpBlob, { contentType: 'image/webp', upsert: true });
    if (upErr) throw new Error(`upload: ${upErr.message}`);

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(newKey);
    return toCdnUrl(pub.publicUrl);
  };

  const updateDb = async (t: Target, newUrl: string) => {
    if (t.kind === 'product_main') {
      const { error } = await supabase.from('products').update({ image_url: newUrl }).eq('id', t.rowId);
      if (error) throw error;
    } else if (t.kind === 'product_supplementary') {
      const { data } = await supabase.from('products').select('supplementary_images').eq('id', t.rowId).single();
      const arr = [...(data?.supplementary_images || [])];
      if (typeof t.index === 'number' && arr[t.index]) arr[t.index] = newUrl;
      const { error } = await supabase.from('products').update({ supplementary_images: arr }).eq('id', t.rowId);
      if (error) throw error;
    } else if (t.kind === 'banner') {
      const { error } = await supabase.from('banners').update({ image_url: newUrl }).eq('id', t.rowId);
      if (error) throw error;
    } else if (t.kind === 'category_image') {
      const { error } = await supabase.from('categories').update({ image_url: newUrl }).eq('id', t.rowId);
      if (error) throw error;
    } else if (t.kind === 'category_section_banner') {
      const { error } = await supabase.from('categories').update({ section_banner_url: newUrl }).eq('id', t.rowId);
      if (error) throw error;
    } else if (t.kind === 'showcase') {
      const { error } = await supabase.from('latest_showcase').update({ image_url: newUrl }).eq('id', t.rowId);
      if (error) throw error;
    }
  };

  const run = async () => {
    if (targets.length === 0) return;
    setRunning(true);
    setDone(0);
    setFailed([]);
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      try {
        addLog(`(${i + 1}/${targets.length}) ${t.kind} — ${t.url.slice(-60)}`);
        const newUrl = await convertOne(t);
        await updateDb(t, newUrl);
        setDone((d) => d + 1);
      } catch (e: any) {
        const reason = e?.message || 'unknown';
        addLog(`  ✗ failed: ${reason}`);
        setFailed((f) => [...f, { target: t, reason }]);
      }
    }
    setRunning(false);
    toast({ title: 'Migration finished', description: `${done + 1} converted, ${failed.length} failed.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
        <ImageIcon size={22} className="text-primary mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold">Convert existing images to WebP</h3>
          <p className="text-sm text-muted-foreground">
            Ai tool scan korbe purano upload kora sob product / banner / category / showcase / logo image,
            protita WebP e convert kore storage e save korbe, ar database URL update kore dibe.
            SVG file gulo untouched thakbe. Purano file gulo delete kora hobe na (safety).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={scan} disabled={scanning || running} variant="outline">
          {scanning ? <><Loader2 size={14} className="mr-2 animate-spin" /> Scanning…</> : 'Scan images'}
        </Button>
        <Button onClick={run} disabled={running || scanning || targets.length === 0}>
          {running ? (
            <><Loader2 size={14} className="mr-2 animate-spin" /> Converting {done}/{targets.length}…</>
          ) : (
            <><Play size={14} className="mr-2" /> Convert {targets.length || ''} image(s)</>
          )}
        </Button>
      </div>

      {(done > 0 || failed.length > 0) && (
        <div className="flex gap-4 text-sm">
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 size={14} /> Converted: {done}
          </span>
          {failed.length > 0 && (
            <span className="inline-flex items-center gap-1 text-destructive">
              <AlertCircle size={14} /> Failed: {failed.length}
            </span>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="max-h-72 overflow-auto text-xs font-mono bg-background border border-border rounded-lg p-3 space-y-0.5">
          {log.map((l, i) => (
            <div key={i} className={l.includes('failed') ? 'text-destructive' : 'text-muted-foreground'}>{l}</div>
          ))}
        </div>
      )}

      {failed.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Failed items ({failed.length})</summary>
          <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
            {failed.map((f, i) => (
              <li key={i} className="truncate">
                <span className="text-destructive">✗</span> {f.target.kind} · {f.reason} · {f.target.url}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

export default AdminImageMigration;
export { AdminImageMigration };
