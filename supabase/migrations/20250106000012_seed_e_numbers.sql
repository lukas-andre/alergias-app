-- Migration: Seed e_numbers with 20+ critical E-codes
-- Focus on ambiguous additives with allergen risk
-- Based on EU regulations and Chilean product usage

insert into e_numbers (code, name_es, likely_origins, linked_allergen_keys, residual_protein_risk, notes) values
  -- LECITINAS (E322) - MUY COMÚN Y AMBIGUO
  ('E322', 'Lecitina',
    ARRAY['soja', 'girasol', 'huevo', 'colza'],
    ARRAY['soja', 'huevo'],
    true,
    'Emulsionante muy común. Generalmente de soja (90% casos), pero puede ser de huevo. Versión refinada puede contener trazas de proteína.'),

  -- MONO Y DIGLICÉRIDOS (E471) - AMBIGUO
  ('E471', 'Mono y diglicéridos de ácidos grasos',
    ARRAY['vegetal', 'animal', 'soja', 'palma'],
    ARRAY['leche'],
    true,
    'Emulsionante que puede ser de origen vegetal o animal. Si es animal, puede derivar de lácteos o carne. Difícil determinar sin especificación del fabricante.'),

  -- COCHINILLA (E120) - INSECTO
  ('E120', 'Cochinilla / Ácido carmínico',
    ARRAY['insecto'],
    ARRAY[]::text[],
    false,
    'Colorante rojo de insectos. No es alérgeno mayor pero puede causar reacciones en personas sensibles. No apto para veganos.'),

  -- GELATINA (E441) - ANIMAL
  ('E441', 'Gelatina',
    ARRAY['cerdo', 'vacuno', 'pescado'],
    ARRAY['pescado'],
    true,
    'Gelificante de origen animal. Generalmente cerdo o vacuno, rara vez pescado. Contiene colágeno. No apto para veganos/vegetarianos.'),

  -- LISOZIMA (E1105) - HUEVO
  ('E1105', 'Lisozima',
    ARRAY['huevo'],
    ARRAY['huevo'],
    true,
    'Conservante derivado de la clara de huevo. ALTO RIESGO para alérgicos al huevo. Común en quesos madurados.'),

  -- ESTERES DE MONO Y DIGLICÉRIDOS (E472a-f) - AMBIGUO
  ('E472a', 'Ésteres acéticos de mono y diglicéridos',
    ARRAY['vegetal', 'animal'],
    ARRAY['leche'],
    false,
    'Similar a E471. Puede ser de origen vegetal o animal (lácteo).'),

  ('E472b', 'Ésteres lácticos de mono y diglicéridos',
    ARRAY['vegetal', 'leche'],
    ARRAY['leche'],
    true,
    'Puede contener derivados lácteos. El ácido láctico puede ser sintético o lácteo.'),

  ('E472c', 'Ésteres cítricos de mono y diglicéridos',
    ARRAY['vegetal', 'animal'],
    ARRAY[]::text[],
    false,
    'Similar a E471, origen variable.'),

  ('E472e', 'Ésteres de mono y diglicéridos',
    ARRAY['vegetal', 'animal'],
    ARRAY['leche'],
    false,
    'Similar a E471. Puede ser vegetal o animal.'),

  -- ESTEAROIL LACTILATOS (E481, E482) - LÁCTEO
  ('E481', 'Estearoil-2-lactilato de sodio',
    ARRAY['leche', 'vegetal'],
    ARRAY['leche'],
    true,
    'Emulsionante que puede derivar de la leche. El "lactilato" sugiere origen lácteo aunque puede ser sintético.'),

  ('E482', 'Estearoil-2-lactilato de calcio',
    ARRAY['leche', 'vegetal'],
    ARRAY['leche'],
    true,
    'Similar a E481. Puede contener derivados lácteos.'),

  -- FOSFATO DE HUESO (E542) - ANIMAL
  ('E542', 'Fosfato de hueso',
    ARRAY['animal'],
    ARRAY[]::text[],
    false,
    'Antiaglomerante de origen animal (huesos). No apto para veganos/vegetarianos.'),

  -- CASEÍNA Y CASEINATOS (E469, no es E-code oficial pero relevante)
  -- Nota: La caseína no tiene E-code pero es importante

  -- ALBÚMINA (no tiene E-code pero relevante)
  -- Nota: Se lista directamente como ingrediente

  -- LACTOSA (no tiene E-code pero relevante)
  -- Nota: Se lista directamente como ingrediente

  -- COLORANTES DERIVADOS DE TARTRAZINA (E102) - NO ALÉRGENO MAYOR PERO SENSIBILIDAD
  ('E102', 'Tartrazina',
    ARRAY['sintético'],
    ARRAY[]::text[],
    false,
    'Colorante amarillo sintético. Puede causar reacciones en personas sensibles, especialmente con sensibilidad a salicilatos o aspirina.'),

  -- CARRAGENANOS (E407) - ALGAS (NO ALÉRGENO PERO SENSIBILIDAD)
  ('E407', 'Carragenanos',
    ARRAY['algas'],
    ARRAY[]::text[],
    false,
    'Espesante de algas marinas. Generalmente seguro pero puede causar problemas digestivos en personas sensibles.'),

  -- GOMA GUAR (E412) - LEGUMBRE
  ('E412', 'Goma guar',
    ARRAY['legumbre'],
    ARRAY[]::text[],
    false,
    'Espesante derivado de legumbre (guar). Puede causar sensibilidad en personas con alergias a legumbres, aunque es raro.'),

  -- GLUTEN (no tiene E-code pero se marca en ingredientes)
  -- Nota: Se detecta directamente

  -- ÁCIDO LÁCTICO (E270) - PUEDE SER LÁCTEO O SINTÉTICO
  ('E270', 'Ácido láctico',
    ARRAY['vegetal', 'leche', 'sintético'],
    ARRAY[]::text[],
    false,
    'Acidulante que puede ser de fermentación láctea o sintético. Generalmente sintético y seguro para intolerantes a lactosa.'),

  -- LACTITOL (E966) - DERIVADO DE LACTOSA
  ('E966', 'Lactitol',
    ARRAY['leche'],
    ARRAY['leche'],
    false,
    'Edulcorante derivado de la lactosa. RIESGO para alérgicos a la leche.'),

  -- LACTATO DE SODIO (E325)
  ('E325', 'Lactato de sodio',
    ARRAY['sintético', 'leche'],
    ARRAY[]::text[],
    false,
    'Regulador de acidez. Generalmente sintético y seguro para alérgicos a la leche.'),

  -- PROTEÍNA DE SUERO (no E-code pero relevante)
  -- Nota: Se lista directamente como "whey protein"

  -- SULFITOS (E220-228) - IMPORTANTE PARA ALÉRGICOS
  ('E220', 'Dióxido de azufre',
    ARRAY['sintético'],
    ARRAY['sulfitos'],
    false,
    'Conservante y antioxidante. Puede causar reacciones graves en asmáticos y sensibles a sulfitos.'),

  ('E221', 'Sulfito de sodio',
    ARRAY['sintético'],
    ARRAY['sulfitos'],
    false,
    'Conservante. Riesgo para asmáticos y sensibles a sulfitos.'),

  ('E222', 'Bisulfito de sodio',
    ARRAY['sintético'],
    ARRAY['sulfitos'],
    false,
    'Conservante. Riesgo para asmáticos y sensibles a sulfitos.'),

  ('E223', 'Metabisulfito de sodio',
    ARRAY['sintético'],
    ARRAY['sulfitos'],
    false,
    'Conservante común en vinos. Riesgo para asmáticos y sensibles a sulfitos.'),

  ('E224', 'Metabisulfito de potasio',
    ARRAY['sintético'],
    ARRAY['sulfitos'],
    false,
    'Conservante. Riesgo para asmáticos y sensibles a sulfitos.')

on conflict (code) do update set
  name_es = excluded.name_es,
  likely_origins = excluded.likely_origins,
  linked_allergen_keys = excluded.linked_allergen_keys,
  residual_protein_risk = excluded.residual_protein_risk,
  notes = excluded.notes;
