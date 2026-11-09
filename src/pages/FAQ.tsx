import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/LegalLayout';
import { HelpCircle } from 'lucide-react';

const FAQ = () => (
  <>
    <SEO
      title="FAQ — Helpful Perfumes"
      description="Frequently Asked Questions about Helpful Perfumes products, shipping, and returns."
      path="/faq"
    />
    <LegalLayout
      slug="faq"
      fallbackTitle="Frequently Asked Questions"
      eyebrow="Help Center"
      icon={HelpCircle}
      accent="from-neutral-600 to-neutral-400"
    />
  </>
);

export default FAQ;
