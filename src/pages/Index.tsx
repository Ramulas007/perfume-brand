import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { CategorySection } from '@/components/CategorySection';
import { TrustBadges } from '@/components/TrustBadges';
import { ProductGrid } from '@/components/ProductGrid';
import { CartSidebar } from '@/components/CartSidebar';
import { Footer } from '@/components/Footer';

import { SEO } from '@/components/SEO';

const Index = () => {
  return (
    <>
      <SEO
        title="Helpful Perfumes — Premium Fragrances in Bangladesh"
        description="Shop authentic designer, Arabic, men's, women's and unisex perfumes with nationwide delivery across Bangladesh."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.staticvibes.site/' },
          ],
        }}
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <h1 className="sr-only">Helpful Perfumes – Premium Fragrances in Bangladesh</h1>
          <HeroBanner />
          <TrustBadges />
          <CategorySection />
          <ProductGrid />
        </main>
        <CartSidebar />
        <Footer />
        
      </div>
    </>
  );
};

export default Index;
