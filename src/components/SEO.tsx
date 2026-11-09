import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const SITE = 'https://www.staticvibes.site';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, any> | Record<string, any>[];
  noIndex?: boolean;
}

export const SEO = ({ title, description, path = '/', image, type = 'website', jsonLd, noIndex }: SEOProps) => {
  const { siteName, seoTitle: defaultTitle, seoDescription: defaultDesc, ogImage: defaultOgImage } = useSiteSettings();
  
  const url = `${SITE}${path}`;
  const displayTitle = title || defaultTitle;
  const displayDesc = description || defaultDesc;
  const ogImage = image || defaultOgImage || `${SITE}/og-image.png`;
  const lds = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  // Default Organization JSON-LD
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": SITE,
    "logo": `${SITE}/logo.png`,
    "sameAs": [
      "https://facebook.com/staticvibes",
      "https://instagram.com/staticvibes"
    ]
  };

  // Website JSON-LD for search name
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "alternateName": ["Helpful Perfumes Bangladesh"],
    "url": SITE
  };

  return (
    <Helmet>
      <title>{displayTitle}</title>
      <meta name="description" content={displayDesc} />
      <link rel="canonical" href={url} />
      
      {/* Site Name for Search Results */}
      <meta property="og:site_name" content={siteName} />
      
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={displayDesc} />
      <meta name="twitter:image" content={ogImage} />
      
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
      {lds.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
