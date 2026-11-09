import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/LegalLayout';
import { RefreshCcw } from 'lucide-react';

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the return window at Helpful Perfumes?',
      acceptedAnswer: { '@type': 'Answer', text: 'We offer hassle-free returns and exchanges within 7 days of delivery.' },
    },
    {
      '@type': 'Question',
      name: 'Which items are eligible for return?',
      acceptedAnswer: { '@type': 'Answer', text: 'Items must be unused, in original packaging, and with all tags attached.' },
    },
  ],
};

const ReturnPolicy = () => (
  <>
    <SEO
      title="Return & Exchange Policy — Helpful Perfumes"
      description="7-day hassle-free returns and exchanges at Helpful Perfumes. Read our eligibility rules and how to start a return."
      path="/return-policy"
      jsonLd={faqLd}
    />
    <LegalLayout
      slug="return-policy"
      fallbackTitle="Return & Exchange"
      eyebrow="Returns"
      icon={RefreshCcw}
      accent="from-neutral-700 to-neutral-500"
    />
  </>
);

export default ReturnPolicy;
