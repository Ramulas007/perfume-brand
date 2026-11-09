import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/LegalLayout';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => (
  <>
    <SEO
      title="Privacy Policy — Helpful Perfumes"
      description="How Helpful Perfumes collects, uses, and protects your personal data when you shop with us."
      path="/privacy-policy"
    />
    <LegalLayout
      slug="privacy-policy"
      fallbackTitle="Privacy Policy"
      eyebrow="Privacy"
      icon={Shield}
      accent="from-neutral-700 to-neutral-400"
    />
  </>
);

export default PrivacyPolicy;
