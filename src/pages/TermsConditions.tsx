import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/LegalLayout';
import { Scale } from 'lucide-react';

const TermsConditions = () => (
  <>
    <SEO
      title="Terms & Conditions — Helpful Perfumes"
      description="The terms and conditions for using the Helpful Perfumes website and purchasing our products."
      path="/terms-conditions"
    />
    <LegalLayout
      slug="terms-conditions"
      fallbackTitle="Terms & Conditions"
      eyebrow="Terms"
      icon={Scale}
      accent="from-neutral-800 to-neutral-500"
    />
  </>
);

export default TermsConditions;
