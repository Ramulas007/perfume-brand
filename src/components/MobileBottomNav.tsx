import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useDesignSettings } from '@/hooks/useDesignSettings';

const getIcon = (name: string) => {
  const I = (Icons as any)[name];
  return I || Icons.Circle;
};

export const MobileBottomNav = () => {
  const { settings } = useDesignSettings();
  const nav = settings.mobileNav;
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Auto hide on scroll
  useEffect(() => {
    if (!nav.autoHideOnScroll) { setHidden(false); return; }
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current && y > 80) setHidden(true);
      else setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [nav.autoHideOnScroll]);

  if (!nav.enabled) return null;
  if (nav.headerMode === 'header' || nav.headerMode === 'none') return null;

  const visibilityClass =
    nav.showOn === 'mobile' ? 'md:hidden'
    : nav.showOn === 'mobile-tablet' ? 'lg:hidden'
    : '';

  const isFloating = nav.position !== 'fixed';
  const isDock = nav.position === 'dock';

  const styleBaseBg = (() => {
    switch (nav.style) {
      case 'glass':
        return 'bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/30';
      case 'ios':
        return 'bg-white/85 backdrop-blur-2xl border-t border-black/5';
      case 'android':
        return 'bg-white border-t border-black/10';
      case 'premium':
        return 'bg-gradient-to-t from-zinc-950 to-zinc-900 text-white border-t border-white/10';
      case 'minimal':
        return 'bg-white border-t border-black/5';
      default:
        return 'bg-background border-t border-border';
    }
  })();

  const inlineStyle: React.CSSProperties = {
    height: nav.height,
    backgroundColor: ['glass', 'premium', 'ios', 'android', 'minimal'].includes(nav.style) ? undefined : nav.bgColor,
    borderRadius: isFloating ? (isDock ? 9999 : nav.radius || 22) : 0,
    boxShadow: nav.shadow
      ? (isFloating ? '0 14px 40px -10px rgba(0,0,0,0.25), 0 6px 14px -6px rgba(0,0,0,0.15)'
                     : '0 -6px 20px -10px rgba(0,0,0,0.15)')
      : 'none',
    backdropFilter: nav.blur ? 'blur(20px)' : undefined,
    WebkitBackdropFilter: nav.blur ? 'blur(20px)' : undefined,
  };

  const wrapperClass = isFloating
    ? `fixed left-1/2 -translate-x-1/2 z-40 w-[min(94vw,520px)] ${isDock ? 'bottom-4' : 'bottom-3'}`
    : 'fixed bottom-0 left-0 right-0 z-40 w-full';

  const items = nav.items?.length ? nav.items : [];

  return (
    <nav
      data-mobile-bottom-nav
      className={`${visibilityClass} ${wrapperClass} transition-transform duration-300 ${
        hidden ? 'translate-y-[120%]' : 'translate-y-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className={`flex items-center justify-around w-full overflow-hidden ${styleBaseBg}`}
        style={inlineStyle}
      >
        {items.map((it) => {
          const Icon = getIcon(it.icon);
          const active = location.pathname === it.href || (it.href !== '/' && location.pathname.startsWith(it.href.split('?')[0]));
          const color = active ? nav.activeColor : nav.inactiveColor;
          return (
            <Link
              key={it.id}
              to={it.href}
              className="flex-1 h-full flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
              style={{ color }}
              aria-label={it.label}
            >
              <Icon size={nav.iconSize} strokeWidth={active ? 2.4 : 1.8} />
              {!nav.iconsOnly && nav.showLabels && (
                <span style={{ fontSize: nav.labelSize, fontWeight: active ? 600 : 500 }} className="leading-none">
                  {it.label}
                </span>
              )}
              {active && nav.style === 'modern' && (
                <span className="absolute top-0 w-8 h-0.5 rounded-b-full" style={{ backgroundColor: color }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
