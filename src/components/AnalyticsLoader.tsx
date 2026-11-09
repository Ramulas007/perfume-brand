import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dynamically injects Google Analytics, Facebook Pixel, and Google Ads
 * tags based on IDs stored in site_settings.api_settings.
 */
const AnalyticsLoader = () => {
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'tracking_settings')
          .maybeSingle();

        if (!mounted || !data?.value) return;
        const v = data.value as Record<string, string>;

        // Google Analytics (GA4)
        if (v.google_analytics_id && !document.getElementById('ga4-script')) {
          const s = document.createElement('script');
          s.id = 'ga4-script';
          s.async = true;
          s.src = `https://www.googletagmanager.com/gtag/js?id=${v.google_analytics_id}`;
          document.head.appendChild(s);

          const inline = document.createElement('script');
          inline.id = 'ga4-init';
          inline.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${v.google_analytics_id}');
            ${v.google_ads_id ? `gtag('config', '${v.google_ads_id}');` : ''}
          `;
          document.head.appendChild(inline);
        }

        // Facebook Pixel
        if (v.facebook_pixel_id && !document.getElementById('fb-pixel')) {
          const s = document.createElement('script');
          s.id = 'fb-pixel';
          s.innerHTML = `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${v.facebook_pixel_id}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(s);
        }

        // Google Tag Manager
        if (v.google_tag_manager_id && !document.getElementById('gtm-script')) {
          const s = document.createElement('script');
          s.id = 'gtm-script';
          s.innerHTML = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${v.google_tag_manager_id}');
          `;
          document.head.appendChild(s);

          const noscript = document.createElement('noscript');
          noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${v.google_tag_manager_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
          document.body.insertBefore(noscript, document.body.firstChild);
        }
      } catch (e) {
        console.error('Analytics load failed', e);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
};

export default AnalyticsLoader;
