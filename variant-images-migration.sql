-- PURE20 variant images per strength
-- Already applied to the live Supabase project on 2026-10-01.
alter table public.pure20_products
  add column if not exists image_url text,
  add column if not exists image_alt_nl text,
  add column if not exists image_alt_en text;

comment on column public.pure20_products.image_url is
  'Public image URL for this exact product variant/strength.';
comment on column public.pure20_products.image_alt_nl is
  'Dutch alt text for the exact product variant image.';
comment on column public.pure20_products.image_alt_en is
  'English alt text for the exact product variant image.';
