import imageCompression from 'browser-image-compression';

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  fileType: 'image/webp' as const,
  useWebWorker: true,
  initialQuality: 0.85,
};

/**
 * Convert any uploaded image to WebP before pushing to Supabase Storage.
 * Non-image files are returned untouched. SVGs are also passed through
 * because they are vector and should not be rasterized.
 */
export async function compressProductImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml') return file;
  if (file.type === 'image/webp' && file.size < 500 * 1024) return file;

  try {
    const blob = await imageCompression(file, DEFAULT_OPTIONS);
    const base = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } catch (err) {
    console.warn('[compressProductImage] conversion to WebP failed, using original', err);
    return file;
  }
}

