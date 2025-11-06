-- Migration: Seed allergen_types with the EU's 14 major allergens
-- Based on EU Regulation 1169/2011 and Chilean food labeling requirements
-- Note: synonyms[] will be migrated to allergen_synonyms table in next migration

insert into allergen_types (key, name_es, notes) values
  ('gluten', 'Gluten (Cereales)', 'Trigo, cebada, centeno, avena, espelta, kamut. Presente en pan, pasta, galletas.'),
  ('crustaceos', 'Crustáceos', 'Camarones, langostinos, jaiba, cangrejo, langosta, etc.'),
  ('huevo', 'Huevo', 'Huevos de gallina y derivados (clara, yema, albúmina, lisozima).'),
  ('pescado', 'Pescado', 'Pescados y derivados. Incluye proteínas de pescado usadas en salsas.'),
  ('mani', 'Maní / Cacahuete', 'Maní (cacahuete, peanut) y productos derivados.'),
  ('soja', 'Soja', 'Soja y derivados (lecitina de soja, tofu, tempeh, salsa de soja).'),
  ('leche', 'Leche y Lácteos', 'Leche de vaca y derivados (queso, yogur, mantequilla, suero, caseína, lactosa).'),
  ('frutos_secos', 'Frutos Secos', 'Almendras, avellanas, nueces, anacardos, pistachos, etc.'),
  ('apio', 'Apio', 'Apio y derivados (hojas, tallos, semillas, especias).'),
  ('mostaza', 'Mostaza', 'Mostaza y derivados (semillas, condimento, salsas).'),
  ('sesamo', 'Sésamo', 'Semillas de sésamo (ajonjolí) y derivados (tahini, aceite).'),
  ('sulfitos', 'Sulfitos', 'Dióxido de azufre y sulfitos (>10 mg/kg). Común en vinos, frutas secas.'),
  ('altramuces', 'Altramuces / Lupino', 'Altramuces (lupino, lupin) y derivados. Usado en harinas y snacks.'),
  ('moluscos', 'Moluscos', 'Caracoles, almejas, mejillones, ostras, pulpo, calamar, etc.')
on conflict (key) do update set
  name_es = excluded.name_es,
  notes = excluded.notes;
