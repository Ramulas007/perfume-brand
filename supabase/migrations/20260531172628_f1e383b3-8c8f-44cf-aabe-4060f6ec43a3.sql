-- The legal_pages table already exists from previous steps. 
-- We just need to ensure the FAQ slug is used.

INSERT INTO public.legal_pages (slug, title, content)
VALUES (
  'faq',
  'Frequently Asked Questions',
  '## General Questions

### What is Static Vibes?
Static Vibes is a premium lifestyle brand dedicated to bringing you high-quality products with a focus on minimalist design and lasting quality.

### Where are you located?
We are based in Bangladesh, providing national delivery to all major cities and districts.

## Ordering & Payment

### How do I place an order?
Simply browse our shop, add items to your cart, and proceed to checkout. You can choose from various secure payment methods.

### What payment methods do you accept?
We accept major credit/debit cards, mobile banking (bKash, Nagad), and Cash on Delivery (COD) for selected locations.

### Can I change or cancel my order?
Orders can be changed or cancelled within 2 hours of placement. Please contact our support team immediately for any changes.

## Shipping & Delivery

### How long does delivery take?
- **Inside Dhaka:** 2-3 business days.
- **Outside Dhaka:** 3-5 business days.

### How can I track my order?
Once your order is shipped, you will receive a tracking ID via SMS or email. You can use this ID on our "Order Tracking" page.

## Returns & Refunds

### What is your return policy?
We offer a 7-day hassle-free return policy for unused items in original packaging. Please refer to our [Return Policy](/return-policy) for full details.

### How do I start a return?
Contact our customer support with your order number and reason for return. We will guide you through the process.

## Contact Support

### How can I reach you?
You can contact us through our [Contact Page](/contact) or call us at our customer service hotline during business hours.'
)
ON CONFLICT (slug) DO UPDATE 
SET content = EXCLUDED.content, 
    title = EXCLUDED.title,
    last_updated = now();
