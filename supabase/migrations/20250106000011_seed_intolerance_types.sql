-- Migration: Seed intolerance_types with common food intolerances
-- These are non-allergic adverse reactions to foods

insert into intolerance_types (key, name_es, notes) values
  ('lactosa', 'Intolerancia a la Lactosa', 'Dificultad para digerir el azúcar de la leche. Diferente a alergia a la leche.'),
  ('fructosa', 'Intolerancia a la Fructosa', 'Dificultad para absorber fructosa. Común en frutas, miel, sirope de maíz.'),
  ('histamina', 'Intolerancia a la Histamina', 'Sensibilidad a alimentos ricos en histamina (vino, quesos maduros, embutidos).'),
  ('fodmap', 'Sensibilidad FODMAP', 'Sensibilidad a carbohidratos fermentables (SII). Incluye lactosa, fructosa, polioles.'),
  ('sorbitol', 'Intolerancia al Sorbitol', 'Sensibilidad a este poliol (E420). Común en chicles y productos sin azúcar.'),
  ('gluten_no_celiaco', 'Sensibilidad al Gluten No Celíaca', 'Reacción al gluten sin ser celíaco. Síntomas digestivos sin daño intestinal.'),
  ('cafeina', 'Sensibilidad a la Cafeína', 'Intolerancia a cafeína (café, té, chocolate, bebidas energéticas).'),
  ('salicilatos', 'Intolerancia a Salicilatos', 'Sensibilidad a estos compuestos naturales en frutas, verduras, especias.')
on conflict (key) do update set
  name_es = excluded.name_es,
  notes = excluded.notes;
