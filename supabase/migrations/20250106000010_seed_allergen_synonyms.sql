-- Migration: Seed allergen_synonyms with Chilean Spanish variations
-- Comprehensive synonym list for fuzzy trigram matching
-- Weight: 1=normal, 2=prioritized (exact match), 3=very high priority

-- Helper: Get allergen_id by key
do $$
declare
  v_gluten uuid;
  v_crustaceos uuid;
  v_huevo uuid;
  v_pescado uuid;
  v_mani uuid;
  v_soja uuid;
  v_leche uuid;
  v_frutos_secos uuid;
  v_apio uuid;
  v_mostaza uuid;
  v_sesamo uuid;
  v_sulfitos uuid;
  v_altramuces uuid;
  v_moluscos uuid;
begin
  -- Get allergen IDs
  select id into v_gluten from allergen_types where key = 'gluten';
  select id into v_crustaceos from allergen_types where key = 'crustaceos';
  select id into v_huevo from allergen_types where key = 'huevo';
  select id into v_pescado from allergen_types where key = 'pescado';
  select id into v_mani from allergen_types where key = 'mani';
  select id into v_soja from allergen_types where key = 'soja';
  select id into v_leche from allergen_types where key = 'leche';
  select id into v_frutos_secos from allergen_types where key = 'frutos_secos';
  select id into v_apio from allergen_types where key = 'apio';
  select id into v_mostaza from allergen_types where key = 'mostaza';
  select id into v_sesamo from allergen_types where key = 'sesamo';
  select id into v_sulfitos from allergen_types where key = 'sulfitos';
  select id into v_altramuces from allergen_types where key = 'altramuces';
  select id into v_moluscos from allergen_types where key = 'moluscos';

  -- GLUTEN synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_gluten, 'gluten', 'es-CL', 3),
    (v_gluten, 'trigo', 'es-CL', 2),
    (v_gluten, 'wheat', 'en', 2),
    (v_gluten, 'cebada', 'es-CL', 2),
    (v_gluten, 'barley', 'en', 2),
    (v_gluten, 'centeno', 'es-CL', 2),
    (v_gluten, 'rye', 'en', 2),
    (v_gluten, 'avena', 'es-CL', 2),
    (v_gluten, 'oat', 'en', 2),
    (v_gluten, 'espelta', 'es-CL', 1),
    (v_gluten, 'kamut', 'es-CL', 1),
    (v_gluten, 'harina de trigo', 'es-CL', 2),
    (v_gluten, 'salvado', 'es-CL', 1),
    (v_gluten, 'almidón de trigo', 'es-CL', 2),
    (v_gluten, 'sémola', 'es-CL', 1),
    (v_gluten, 'malta', 'es-CL', 2) -- Malta deriva de cebada
  on conflict (allergen_id, lower(surface)) do nothing;

  -- CRUSTÁCEOS synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_crustaceos, 'crustáceos', 'es-CL', 3),
    (v_crustaceos, 'crustaceos', 'es-CL', 3),
    (v_crustaceos, 'camarón', 'es-CL', 2),
    (v_crustaceos, 'camaron', 'es-CL', 2),
    (v_crustaceos, 'shrimp', 'en', 2),
    (v_crustaceos, 'langostino', 'es-CL', 2),
    (v_crustaceos, 'prawn', 'en', 2),
    (v_crustaceos, 'jaiba', 'es-CL', 2),
    (v_crustaceos, 'cangrejo', 'es-CL', 2),
    (v_crustaceos, 'crab', 'en', 2),
    (v_crustaceos, 'langosta', 'es-CL', 2),
    (v_crustaceos, 'lobster', 'en', 2),
    (v_crustaceos, 'cigala', 'es-CL', 1)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- HUEVO synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_huevo, 'huevo', 'es-CL', 3),
    (v_huevo, 'egg', 'en', 3),
    (v_huevo, 'clara', 'es-CL', 2),
    (v_huevo, 'yema', 'es-CL', 2),
    (v_huevo, 'albúmina', 'es-CL', 2),
    (v_huevo, 'albumina', 'es-CL', 2),
    (v_huevo, 'albumen', 'en', 2),
    (v_huevo, 'lecitina de huevo', 'es-CL', 2),
    (v_huevo, 'lisozima', 'es-CL', 2), -- E1105
    (v_huevo, 'lysozyme', 'en', 2),
    (v_huevo, 'ovoproducto', 'es-CL', 1)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- PESCADO synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_pescado, 'pescado', 'es-CL', 3),
    (v_pescado, 'fish', 'en', 3),
    (v_pescado, 'atún', 'es-CL', 2),
    (v_pescado, 'atun', 'es-CL', 2),
    (v_pescado, 'tuna', 'en', 2),
    (v_pescado, 'salmón', 'es-CL', 2),
    (v_pescado, 'salmon', 'es-CL', 2),
    (v_pescado, 'merluza', 'es-CL', 2),
    (v_pescado, 'anchoa', 'es-CL', 2),
    (v_pescado, 'anchovy', 'en', 2),
    (v_pescado, 'bacalao', 'es-CL', 2),
    (v_pescado, 'salsa de pescado', 'es-CL', 2),
    (v_pescado, 'gelatina de pescado', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- MANÍ synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_mani, 'maní', 'es-CL', 3),
    (v_mani, 'mani', 'es-CL', 3),
    (v_mani, 'cacahuete', 'es-CL', 3),
    (v_mani, 'cacahuate', 'es-MX', 3),
    (v_mani, 'peanut', 'en', 3),
    (v_mani, 'mantequilla de maní', 'es-CL', 2),
    (v_mani, 'pasta de maní', 'es-CL', 2),
    (v_mani, 'aceite de maní', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- SOJA synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_soja, 'soja', 'es-CL', 3),
    (v_soja, 'soya', 'es-CL', 3),
    (v_soja, 'soy', 'en', 3),
    (v_soja, 'lecitina de soja', 'es-CL', 2), -- E322
    (v_soja, 'lecitina de soya', 'es-CL', 2),
    (v_soja, 'tofu', 'es-CL', 2),
    (v_soja, 'tempeh', 'es-CL', 2),
    (v_soja, 'miso', 'es-CL', 2),
    (v_soja, 'salsa de soja', 'es-CL', 2),
    (v_soja, 'proteína de soja', 'es-CL', 2),
    (v_soja, 'aceite de soja', 'es-CL', 2),
    (v_soja, 'edamame', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- LECHE synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_leche, 'leche', 'es-CL', 3),
    (v_leche, 'milk', 'en', 3),
    (v_leche, 'lácteo', 'es-CL', 3),
    (v_leche, 'lacteo', 'es-CL', 3),
    (v_leche, 'dairy', 'en', 3),
    (v_leche, 'lactosa', 'es-CL', 2),
    (v_leche, 'lactose', 'en', 2),
    (v_leche, 'caseína', 'es-CL', 2),
    (v_leche, 'caseina', 'es-CL', 2),
    (v_leche, 'casein', 'en', 2),
    (v_leche, 'suero', 'es-CL', 2),
    (v_leche, 'whey', 'en', 2),
    (v_leche, 'queso', 'es-CL', 2),
    (v_leche, 'yogur', 'es-CL', 2),
    (v_leche, 'yogurt', 'es-CL', 2),
    (v_leche, 'mantequilla', 'es-CL', 2),
    (v_leche, 'butter', 'en', 2),
    (v_leche, 'crema', 'es-CL', 2),
    (v_leche, 'nata', 'es-ES', 2),
    (v_leche, 'ghee', 'es-CL', 1) -- Ghee puede tener trazas
  on conflict (allergen_id, lower(surface)) do nothing;

  -- FRUTOS SECOS synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_frutos_secos, 'frutos secos', 'es-CL', 3),
    (v_frutos_secos, 'tree nuts', 'en', 3),
    (v_frutos_secos, 'nuts', 'en', 3),
    (v_frutos_secos, 'almendra', 'es-CL', 2),
    (v_frutos_secos, 'almond', 'en', 2),
    (v_frutos_secos, 'avellana', 'es-CL', 2),
    (v_frutos_secos, 'hazelnut', 'en', 2),
    (v_frutos_secos, 'nuez', 'es-CL', 2),
    (v_frutos_secos, 'walnut', 'en', 2),
    (v_frutos_secos, 'anacardo', 'es-CL', 2),
    (v_frutos_secos, 'cashew', 'en', 2),
    (v_frutos_secos, 'pistacho', 'es-CL', 2),
    (v_frutos_secos, 'pistachio', 'en', 2),
    (v_frutos_secos, 'pecana', 'es-CL', 2),
    (v_frutos_secos, 'pecan', 'en', 2),
    (v_frutos_secos, 'macadamia', 'es-CL', 2),
    (v_frutos_secos, 'castaña', 'es-CL', 2),
    (v_frutos_secos, 'chestnut', 'en', 2),
    (v_frutos_secos, 'nuez de brasil', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- APIO synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_apio, 'apio', 'es-CL', 3),
    (v_apio, 'celery', 'en', 3),
    (v_apio, 'semilla de apio', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- MOSTAZA synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_mostaza, 'mostaza', 'es-CL', 3),
    (v_mostaza, 'mustard', 'en', 3),
    (v_mostaza, 'semilla de mostaza', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- SÉSAMO synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_sesamo, 'sésamo', 'es-CL', 3),
    (v_sesamo, 'sesamo', 'es-CL', 3),
    (v_sesamo, 'ajonjolí', 'es-CL', 3),
    (v_sesamo, 'ajonjoli', 'es-CL', 3),
    (v_sesamo, 'sesame', 'en', 3),
    (v_sesamo, 'tahini', 'es-CL', 2),
    (v_sesamo, 'tahín', 'es-CL', 2),
    (v_sesamo, 'aceite de sésamo', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- SULFITOS synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_sulfitos, 'sulfitos', 'es-CL', 3),
    (v_sulfitos, 'sulfites', 'en', 3),
    (v_sulfitos, 'dióxido de azufre', 'es-CL', 2),
    (v_sulfitos, 'sulfur dioxide', 'en', 2),
    (v_sulfitos, 'E220', 'es-CL', 2),
    (v_sulfitos, 'E221', 'es-CL', 1),
    (v_sulfitos, 'E222', 'es-CL', 1),
    (v_sulfitos, 'E223', 'es-CL', 1),
    (v_sulfitos, 'E224', 'es-CL', 1)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- ALTRAMUCES synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_altramuces, 'altramuz', 'es-CL', 3),
    (v_altramuces, 'altramuces', 'es-CL', 3),
    (v_altramuces, 'lupino', 'es-CL', 3),
    (v_altramuces, 'lupin', 'en', 3),
    (v_altramuces, 'harina de lupino', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

  -- MOLUSCOS synonyms
  insert into allergen_synonyms (allergen_id, surface, locale, weight) values
    (v_moluscos, 'moluscos', 'es-CL', 3),
    (v_moluscos, 'molluscs', 'en', 3),
    (v_moluscos, 'almeja', 'es-CL', 2),
    (v_moluscos, 'clam', 'en', 2),
    (v_moluscos, 'mejillón', 'es-CL', 2),
    (v_moluscos, 'mejillon', 'es-CL', 2),
    (v_moluscos, 'mussel', 'en', 2),
    (v_moluscos, 'ostra', 'es-CL', 2),
    (v_moluscos, 'oyster', 'en', 2),
    (v_moluscos, 'pulpo', 'es-CL', 2),
    (v_moluscos, 'octopus', 'en', 2),
    (v_moluscos, 'calamar', 'es-CL', 2),
    (v_moluscos, 'squid', 'en', 2),
    (v_moluscos, 'caracol', 'es-CL', 2),
    (v_moluscos, 'snail', 'en', 2),
    (v_moluscos, 'sepia', 'es-CL', 2)
  on conflict (allergen_id, lower(surface)) do nothing;

end $$;
