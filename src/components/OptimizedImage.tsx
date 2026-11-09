import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toCdnUrl, toImgUrl, toOriginUrl } from '@/lib/cdn';


interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'banner' | 'auto';
  lowQualitySrc?: string;
  priority?: boolean;
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  containerClassName,
  aspectRatio = 'auto',
  lowQualitySrc,
  priority = false,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    banner: 'aspect-[3/1]',
    auto: '',
  };

  const targetWidth = Math.round(Number(props.width) || 800);
  // Try the on-the-fly transformation proxy first (resized webp).
  // If that fails (e.g. transformation disabled on the project) we
  // fall back to the branded /cdn proxy (original file), and finally
  // to the raw Supabase Storage URL — so images never stay broken.
  const branded = toCdnUrl(src);
  const transformed = toImgUrl(src, { width: targetWidth, quality: 70, format: 'webp' });
  const initialSrc = transformed || branded || src;

  // Build a responsive srcset so mobile devices don't download a 1920px image.
  const widths = Array.from(new Set([400, 640, 828, 1080, 1280, 1600, targetWidth]))
    .filter((w) => w <= Math.max(targetWidth, 1600))
    .sort((a, b) => a - b);
  const srcSet = transformed
    ? widths
        .map((w) => `${toImgUrl(src, { width: w, quality: 70, format: 'webp' })} ${w}w`)
        .filter((s) => s.startsWith('/'))
        .join(', ')
    : undefined;
  const sizesAttr = (props as any).sizes ||
    (aspectRatio === 'banner' ? '100vw' : '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw');


  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [stage, setStage] = useState<'transformed' | 'cdn' | 'origin' | 'done'>(
    transformed ? 'transformed' : branded.startsWith('/cdn/') ? 'cdn' : 'origin'
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-transparent",
        aspectClasses[aspectRatio],
        containerClassName
      )}
    >
      {!isLoaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-secondary/50" />
      )}

      <img
        src={currentSrc}
        srcSet={stage === 'transformed' ? srcSet : undefined}
        sizes={stage === 'transformed' ? sizesAttr : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          // Cascade: transformed -> cdn proxy -> origin Supabase URL
          if (stage === 'transformed') {
            const next = branded || src;
            if (next && next !== currentSrc) {
              console.warn(
                '[OptimizedImage] /img transform failed, falling back to',
                branded.startsWith('/cdn/') ? 'CDN proxy' : 'origin',
                { failed: currentSrc, fallback: next },
              );
              setStage(branded.startsWith('/cdn/') ? 'cdn' : 'origin');
              setCurrentSrc(next);
              return;
            }
          }
          if (stage === 'cdn') {
            const origin = toOriginUrl(branded) || src;
            if (origin && origin !== currentSrc) {
              console.warn('[OptimizedImage] /cdn proxy failed, falling back to origin', {
                failed: currentSrc,
                fallback: origin,
              });
              setStage('origin');
              setCurrentSrc(origin);
              return;
            }
          }
          setError(true);
          setIsLoaded(true);
        }}
        className={cn(
          "w-full h-full transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />


      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
          <span className="text-xs text-muted-foreground italic">Failed to load</span>
        </div>
      )}
    </div>
  );
};
