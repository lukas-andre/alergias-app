-- ============================================================================
-- MIGRATION: Merchants MVP — Tables, RLS, Indexes, Functions, Seeds
-- ============================================================================
-- Creates tables for verified businesses (merchants) that can display on map/carousel
-- Implements public read access (approved + active billing) and admin-only writes

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Billing status for merchant subscriptions
DO $$ BEGIN
  CREATE TYPE billing_status AS ENUM ('trial', 'active', 'past_due', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Media type for merchant images
DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('cover', 'gallery');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Main merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  short_desc text,
  logo_url text,
  diet_tags text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  is_approved boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  billing_status billing_status NOT NULL DEFAULT 'trial',
  priority_score int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.merchants IS 'Verified businesses that can be displayed on map/carousel';
COMMENT ON COLUMN public.merchants.slug IS 'URL-safe unique identifier';
COMMENT ON COLUMN public.merchants.diet_tags IS 'Dietary tags like sin_gluten, vegano, sin_lactosa';
COMMENT ON COLUMN public.merchants.categories IS 'Business categories like cafe, restaurante, panaderia';
COMMENT ON COLUMN public.merchants.is_approved IS 'Approved by nutritionist';
COMMENT ON COLUMN public.merchants.billing_status IS 'Subscription status';
COMMENT ON COLUMN public.merchants.priority_score IS 'Higher score = higher ranking in listings';

-- Merchant locations (can have multiple branches)
CREATE TABLE IF NOT EXISTS public.merchant_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  region_code text,
  hours jsonb,
  phone text,
  website text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_latitude CHECK (lat >= -90 AND lat <= 90),
  CONSTRAINT valid_longitude CHECK (lng >= -180 AND lng <= 180)
);

COMMENT ON TABLE public.merchant_locations IS 'Physical locations for merchants (can have multiple branches)';
COMMENT ON COLUMN public.merchant_locations.is_primary IS 'Primary location used for map display';
COMMENT ON COLUMN public.merchant_locations.hours IS 'JSON with opening hours by day';

-- Merchant media (logo, cover, gallery images)
CREATE TABLE IF NOT EXISTS public.merchant_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url text NOT NULL,
  alt text,
  "order" int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.merchant_media IS 'Images for merchant profiles (cover, gallery)';
COMMENT ON COLUMN public.merchant_media."order" IS 'Display order in gallery';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS merchants_approved_billing_idx
  ON public.merchants (is_approved, billing_status);

CREATE INDEX IF NOT EXISTS merchants_priority_idx
  ON public.merchants (priority_score DESC);

CREATE INDEX IF NOT EXISTS merchants_slug_idx
  ON public.merchants (slug);

CREATE INDEX IF NOT EXISTS merchants_diet_tags_idx
  ON public.merchants USING GIN (diet_tags);

CREATE INDEX IF NOT EXISTS merchants_categories_idx
  ON public.merchants USING GIN (categories);

CREATE INDEX IF NOT EXISTS merchant_locations_merchant_idx
  ON public.merchant_locations (merchant_id);

CREATE INDEX IF NOT EXISTS merchant_locations_region_idx
  ON public.merchant_locations (region_code);

CREATE INDEX IF NOT EXISTS merchant_locations_primary_idx
  ON public.merchant_locations (merchant_id, is_primary);

CREATE INDEX IF NOT EXISTS merchant_media_merchant_idx
  ON public.merchant_media (merchant_id);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
DO $$ BEGIN
  CREATE TRIGGER merchants_set_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER merchant_locations_set_updated_at
    BEFORE UPDATE ON public.merchant_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 5. HAVERSINE DISTANCE FUNCTION
-- ============================================================================

-- Calculate distance in kilometers between two lat/lng points
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  r double precision := 6371; -- Earth radius in km
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);

  a := pow(sin(dlat / 2), 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       pow(sin(dlon / 2), 2);

  c := 2 * asin(sqrt(a));

  RETURN r * c;
END;
$$;

COMMENT ON FUNCTION public.haversine_km IS 'Calculate distance between two lat/lng coordinates in kilometers';

-- ============================================================================
-- 6. RPC FUNCTION: Get nearby merchants
-- ============================================================================

-- Get merchants near a location with distance calculation
CREATE OR REPLACE FUNCTION public.get_nearby_merchants(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 10,
  p_diet_tags text[] DEFAULT NULL,
  p_categories text[] DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  slug text,
  display_name text,
  short_desc text,
  logo_url text,
  diet_tags text[],
  categories text[],
  priority_score int,
  lat double precision,
  lng double precision,
  address text,
  distance_km double precision
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH merchant_distances AS (
    SELECT
      m.id,
      m.slug,
      m.display_name,
      m.short_desc,
      m.logo_url,
      m.diet_tags,
      m.categories,
      m.priority_score,
      l.lat,
      l.lng,
      l.address,
      public.haversine_km(p_lat, p_lng, l.lat, l.lng) AS dist_km
    FROM public.merchants m
    INNER JOIN public.merchant_locations l
      ON l.merchant_id = m.id AND l.is_primary = true
    WHERE
      m.is_approved = true
      AND m.billing_status IN ('trial', 'active')
      AND (p_diet_tags IS NULL OR m.diet_tags && p_diet_tags)
      AND (p_categories IS NULL OR m.categories && p_categories)
  )
  SELECT
    md.id,
    md.slug,
    md.display_name,
    md.short_desc,
    md.logo_url,
    md.diet_tags,
    md.categories,
    md.priority_score,
    md.lat,
    md.lng,
    md.address,
    md.dist_km
  FROM merchant_distances md
  WHERE md.dist_km <= p_radius_km
  ORDER BY
    (md.dist_km < 1.0) DESC,  -- Prioritize very close locations
    md.priority_score DESC,
    md.dist_km ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_nearby_merchants IS 'Get approved merchants within radius, sorted by proximity and priority';

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_media ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Merchants RLS Policies
-- ============================================================================

-- Public: Read approved merchants with active/trial billing
CREATE POLICY merchants_select_public
  ON public.merchants
  FOR SELECT
  USING (
    is_approved = true
    AND billing_status IN ('trial', 'active')
  );

-- Admin: Full access to all merchants
CREATE POLICY merchants_admin_all
  ON public.merchants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_key = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_key = 'owner'
    )
  );

-- ============================================================================
-- Merchant Locations RLS Policies
-- ============================================================================

-- Public: Read locations of approved merchants
CREATE POLICY merchant_locations_select_public
  ON public.merchant_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.merchants m
      WHERE m.id = merchant_id
        AND m.is_approved = true
        AND m.billing_status IN ('trial', 'active')
    )
  );

-- Admin: Full access to all locations
CREATE POLICY merchant_locations_admin_all
  ON public.merchant_locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_key = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_key = 'owner'
    )
  );

-- ============================================================================
-- Merchant Media RLS Policies
-- ============================================================================

-- Public: Read media of approved merchants
CREATE POLICY merchant_media_select_public
  ON public.merchant_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.merchants m
      WHERE m.id = merchant_id
        AND m.is_approved = true
        AND m.billing_status IN ('trial', 'active')
    )
  );

-- Admin: Full access to all media
CREATE POLICY merchant_media_admin_all
  ON public.merchant_media
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_key = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_key = 'owner'
    )
  );

-- ============================================================================
-- 8. SEED DATA (10 merchants across 3 regions)
-- ============================================================================

-- Insert seed merchants
INSERT INTO public.merchants (
  slug,
  display_name,
  short_desc,
  logo_url,
  diet_tags,
  categories,
  is_approved,
  billing_status,
  priority_score
)
VALUES
  (
    'cafe-andino',
    'Café Andino',
    'Cafetería con opciones sin gluten y veganas',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    ARRAY['sin_gluten', 'veg_friendly'],
    ARRAY['cafe'],
    true,
    'active',
    90
  ),
  (
    'green-bowl',
    'Green Bowl',
    'Bowls saludables 100% veganos',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    ARRAY['vegano', 'sin_lactosa'],
    ARRAY['saludable'],
    true,
    'trial',
    80
  ),
  (
    'pastas-mamma',
    'Pastas Mamma',
    'Pasta artesanal italiana',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    ARRAY['contiene_gluten'],
    ARRAY['italiano'],
    true,
    'active',
    70
  ),
  (
    'la-arepera',
    'La Arepera',
    'Arepas sin gluten 100% maíz',
    'https://images.unsplash.com/photo-1612871689350-b5c5c6e5e5c7?w=400',
    ARRAY['sin_gluten'],
    ARRAY['venezolano'],
    true,
    'active',
    75
  ),
  (
    'sushi-fresh',
    'Sushi Fresh',
    'Sushi con opciones sin soya',
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    ARRAY['sin_soya'],
    ARRAY['sushi'],
    true,
    'trial',
    65
  ),
  (
    'parrilla-sur',
    'Parrilla Sur',
    'Parrilla con opciones low-FODMAP',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    ARRAY['low_fodmap'],
    ARRAY['parrilla'],
    true,
    'active',
    60
  ),
  (
    'panaderia-arte',
    'Panadería Arte',
    'Panadería con línea sin gluten certificada',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    ARRAY['sin_gluten'],
    ARRAY['panaderia'],
    true,
    'past_due',
    40
  ),
  (
    'dulce-violeta',
    'Dulce Violeta',
    'Repostería sin lactosa',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    ARRAY['sin_lactosa'],
    ARRAY['reposteria'],
    true,
    'active',
    55
  ),
  (
    'tandoor-cl',
    'Tandoor CL',
    'Cocina india con opciones veganas',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    ARRAY['vegano'],
    ARRAY['india'],
    true,
    'trial',
    50
  ),
  (
    'poke-rio',
    'Poke Río',
    'Poke bowls personalizables',
    'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400',
    ARRAY['sin_gluten', 'sin_lactosa'],
    ARRAY['poke'],
    true,
    'inactive',
    20
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert locations for Santiago (RM) merchants
INSERT INTO public.merchant_locations (
  merchant_id,
  lat,
  lng,
  address,
  region_code,
  hours,
  phone,
  website,
  is_primary
)
SELECT
  m.id,
  -33.4489,
  -70.6693,
  'Santiago Centro, Región Metropolitana',
  'RM',
  '{"lunes": "09:00-20:00", "martes": "09:00-20:00", "miercoles": "09:00-20:00", "jueves": "09:00-20:00", "viernes": "09:00-21:00", "sabado": "10:00-21:00", "domingo": "cerrado"}'::jsonb,
  '+56 2 2222 3333',
  'https://example.com',
  true
FROM public.merchants m
WHERE m.slug IN ('cafe-andino', 'green-bowl', 'sushi-fresh', 'parrilla-sur', 'dulce-violeta', 'poke-rio')
ON CONFLICT DO NOTHING;

-- Insert locations for Valdivia (LR) merchants
INSERT INTO public.merchant_locations (
  merchant_id,
  lat,
  lng,
  address,
  region_code,
  hours,
  phone,
  website,
  is_primary
)
SELECT
  m.id,
  -39.8289,
  -73.2459,
  'Valdivia, Los Ríos',
  'LR',
  '{"lunes": "08:00-19:00", "martes": "08:00-19:00", "miercoles": "08:00-19:00", "jueves": "08:00-19:00", "viernes": "08:00-19:00", "sabado": "09:00-15:00", "domingo": "cerrado"}'::jsonb,
  '+56 63 2222 444',
  'https://example.com',
  true
FROM public.merchants m
WHERE m.slug IN ('la-arepera', 'panaderia-arte')
ON CONFLICT DO NOTHING;

-- Insert locations for Valparaíso (VS) merchants
INSERT INTO public.merchant_locations (
  merchant_id,
  lat,
  lng,
  address,
  region_code,
  hours,
  phone,
  website,
  is_primary
)
SELECT
  m.id,
  -33.0472,
  -71.6127,
  'Valparaíso, Región de Valparaíso',
  'VS',
  '{"lunes": "10:00-22:00", "martes": "10:00-22:00", "miercoles": "10:00-22:00", "jueves": "10:00-22:00", "viernes": "10:00-23:00", "sabado": "11:00-23:00", "domingo": "11:00-21:00"}'::jsonb,
  '+56 32 2333 555',
  'https://example.com',
  true
FROM public.merchants m
WHERE m.slug IN ('pastas-mamma', 'tandoor-cl')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
