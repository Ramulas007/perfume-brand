
-- Rename existing T-Shirts to T-Shirt
UPDATE public.categories SET name='T-Shirt', slug='t-shirt' WHERE slug='t-shirts';

-- Insert new top-level categories (skip if exists)
INSERT INTO public.categories (name, slug) VALUES
  ('Cap','cap'),
  ('Perfume','perfume'),
  ('Panjabi','panjabi'),
  ('Combo Offers','combo-offers'),
  ('Special Offers','special-offers')
ON CONFLICT (slug) DO NOTHING;

-- T-Shirt subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('Basic T-Shirt','basic-t-shirt'),
  ('Drop Shoulder T-Shirt','drop-shoulder-t-shirt'),
  ('Acid Wash T-Shirt','acid-wash-t-shirt'),
  ('Oversized T-Shirt','oversized-t-shirt'),
  ('Graphic T-Shirt','graphic-t-shirt')
) AS v(name,slug), public.categories p WHERE p.slug='t-shirt'
ON CONFLICT (slug) DO NOTHING;

-- Cap subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('Islamic Tupi','islamic-tupi'),
  ('Baseball Cap','baseball-cap'),
  ('Premium Cap','premium-cap'),
  ('Snapback Cap','snapback-cap')
) AS v(name,slug), public.categories p WHERE p.slug='cap'
ON CONFLICT (slug) DO NOTHING;

-- Perfume subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('Premium Branded Original Perfume','premium-branded-original-perfume'),
  ('Signature Perfume by Static Vibes','signature-perfume-static-vibes'),
  ('Local Perfume','local-perfume'),
  ('Attar Collection','attar-collection')
) AS v(name,slug), public.categories p WHERE p.slug='perfume'
ON CONFLICT (slug) DO NOTHING;

-- Panjabi subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('Premium Panjabi','premium-panjabi'),
  ('Casual Panjabi','casual-panjabi'),
  ('Eid Collection Panjabi','eid-collection-panjabi'),
  ('Exclusive Panjabi','exclusive-panjabi')
) AS v(name,slug), public.categories p WHERE p.slug='panjabi'
ON CONFLICT (slug) DO NOTHING;

-- Accessories subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('Watch','watch'),
  ('Sunglasses','sunglasses'),
  ('Ring','ring'),
  ('Bracelet','bracelet'),
  ('Wallet','wallet'),
  ('Chain','chain')
) AS v(name,slug), public.categories p WHERE p.slug='accessories'
ON CONFLICT (slug) DO NOTHING;

-- Combo Offers subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('T-Shirt Combo','t-shirt-combo'),
  ('Panjabi Combo','panjabi-combo'),
  ('Perfume Combo','perfume-combo'),
  ('Accessories Combo','accessories-combo')
) AS v(name,slug), public.categories p WHERE p.slug='combo-offers'
ON CONFLICT (slug) DO NOTHING;

-- Special Offers subcategories
INSERT INTO public.categories (name, slug, parent_id)
SELECT v.name, v.slug, p.id FROM (VALUES
  ('Flash Sale','flash-sale'),
  ('New Arrivals','new-arrivals'),
  ('Best Sellers','best-sellers'),
  ('Limited Edition','limited-edition'),
  ('Discount Deals','discount-deals')
) AS v(name,slug), public.categories p WHERE p.slug='special-offers'
ON CONFLICT (slug) DO NOTHING;
