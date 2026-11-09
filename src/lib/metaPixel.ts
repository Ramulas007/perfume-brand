// Meta Pixel helper — typed wrappers around the global fbq()
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export const META_PIXEL_ID = '1748454912696138';

const fbq = (...args: any[]) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq(...args);
    } catch (e) {
      console.error('fbq error', e);
    }
  }
};

export const trackPageView = () => fbq('track', 'PageView');

export const trackViewContent = (params: {
  content_ids: string[];
  content_name?: string;
  content_type?: string;
  value?: number;
  currency?: string;
}) =>
  fbq('track', 'ViewContent', {
    content_type: 'product',
    currency: 'BDT',
    ...params,
  });

export const trackAddToCart = (params: {
  content_ids: string[];
  content_name?: string;
  value?: number;
  currency?: string;
  contents?: { id: string; quantity: number }[];
}) =>
  fbq('track', 'AddToCart', {
    content_type: 'product',
    currency: 'BDT',
    ...params,
  });

export const trackInitiateCheckout = (params: {
  content_ids: string[];
  value?: number;
  currency?: string;
  num_items?: number;
  contents?: { id: string; quantity: number }[];
}) =>
  fbq('track', 'InitiateCheckout', {
    content_type: 'product',
    currency: 'BDT',
    ...params,
  });

export const trackPurchase = (params: {
  content_ids: string[];
  value: number;
  currency?: string;
  num_items?: number;
  contents?: { id: string; quantity: number }[];
  order_id?: string;
}) =>
  fbq('track', 'Purchase', {
    content_type: 'product',
    currency: 'BDT',
    ...params,
  });
