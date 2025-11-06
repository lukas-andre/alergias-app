-- Migration: Seed diet_types with common dietary preferences
-- Chilean and international dietary restrictions and preferences

insert into diet_types (key, name_es, description) values
  ('vegano', 'Vegano', 'Sin productos de origen animal (carne, lácteos, huevos, miel)'),
  ('vegetariano', 'Vegetariano', 'Sin carne ni pescado, puede incluir lácteos y huevos'),
  ('celiaco', 'Celíaco / Sin Gluten', 'Libre de trigo, cebada, centeno y avena contaminada'),
  ('sin_lactosa', 'Sin Lactosa', 'Sin productos lácteos o con lactosa removida'),
  ('kosher', 'Kosher', 'Cumple con las leyes dietéticas judías'),
  ('halal', 'Halal', 'Cumple con las leyes dietéticas islámicas'),
  ('paleo', 'Paleo', 'Basado en alimentos no procesados (sin granos, lácteos, legumbres)'),
  ('keto', 'Keto / Cetogénica', 'Muy baja en carbohidratos, alta en grasas'),
  ('sin_azucar', 'Sin Azúcar Añadido', 'Sin azúcares refinados o agregados'),
  ('pescetariano', 'Pescetariano', 'Vegetariano que incluye pescado y mariscos'),
  ('fodmap', 'Bajo FODMAP', 'Baja en carbohidratos fermentables (para SII)'),
  ('sin_soja', 'Sin Soja', 'Sin soja ni derivados (lecitina, tofu, tempeh)'),
  ('sin_frutos_secos', 'Sin Frutos Secos', 'Sin nueces, almendras, avellanas, etc.'),
  ('sin_mani', 'Sin Maní', 'Sin maní (cacahuete) ni trazas'),
  ('sin_huevo', 'Sin Huevo', 'Sin huevos ni derivados')
on conflict (key) do update set
  name_es = excluded.name_es,
  description = excluded.description;
