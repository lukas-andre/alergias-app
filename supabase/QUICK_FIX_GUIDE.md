# 🚨 Quick Fix Guide

## TL;DR

Dos migraciones fallaron. Aquí está la solución rápida:

### Paso 1: Limpiar triggers rotos

Corre esto en Supabase SQL Editor:

```sql
-- Drop triggers que fallaron
DROP TRIGGER IF EXISTS set_updated_at_trigger ON diet_types;
DROP TRIGGER IF EXISTS set_updated_at_trigger ON allergen_types;
DROP TRIGGER IF EXISTS set_updated_at_trigger ON intolerance_types;
```

### Paso 2: Aplicar versiones corregidas

Aplica estos dos archivos **FIXED** en orden:

1. **`20250106000006_add_triggers_and_functions_FIXED.sql`**
   - Solo aplica triggers a tablas con `updated_at`
   - Ya no intentará añadir trigger a diet_types, allergen_types, etc.

2. **`20250106000010_seed_allergen_synonyms_FIXED.sql`**
   - Verifica que allergen_types existan antes de insertar synonyms
   - Usa patrón seguro con EXISTS + LATERAL join

### Paso 3: Verificar

```sql
-- ¿Cuántos synonyms se insertaron?
SELECT COUNT(*) FROM allergen_synonyms;
-- Debería ser > 50

-- ¿Qué allergens tienen synonyms?
SELECT a.key, COUNT(s.id) as synonyms
FROM allergen_types a
LEFT JOIN allergen_synonyms s ON s.allergen_id = a.id
GROUP BY a.key
ORDER BY synonyms DESC;
```

---

## Explicación del Problema

### Problema 1: set_updated_at trigger

❌ **Error original:**
```
ERROR: record "new" has no field "updated_at"
```

🔧 **Causa:** Las tablas `diet_types`, `allergen_types`, `intolerance_types` NO tienen columna `updated_at` en tu schema actual.

✅ **Solución:** El archivo FIXED solo aplica el trigger a tablas que SÍ tienen `updated_at`:
- user_profiles ✓
- strictness_profiles ✓
- extractions ✓
- app_settings ✓
- e_numbers ✓

### Problema 2: allergen_synonyms seed

❌ **Error original:**
```
ERROR: null value in column "allergen_id" violates not-null constraint
```

🔧 **Causa:** El código original hacía:
```sql
SELECT id INTO v_gluten FROM allergen_types WHERE key = 'gluten';
-- Si no existe, v_gluten = NULL
INSERT INTO allergen_synonyms (allergen_id, ...) VALUES (v_gluten, ...);
-- ❌ BOOM! allergen_id cannot be NULL
```

✅ **Solución:** El archivo FIXED usa un patrón seguro:
```sql
IF EXISTS (SELECT 1 FROM allergen_types WHERE key = 'gluten') THEN
  INSERT INTO allergen_synonyms ...
  -- Solo se ejecuta si existe el allergen
END IF;
```

---

## Archivos a Usar

✅ **Usar estos (FIXED):**
- `20250106000006_add_triggers_and_functions_FIXED.sql`
- `20250106000010_seed_allergen_synonyms_FIXED.sql`

❌ **NO usar estos (originales con errores):**
- `20250106000006_add_triggers_and_functions.sql`
- `20250106000010_seed_allergen_synonyms.sql`

---

## Orden Completo de Aplicación

Si empiezas desde cero, este es el orden correcto:

```
✅ 01. allergen_synonyms table
✅ 02. e_numbers table
✅ 03. extractions table
✅ 04. extraction_tokens table
✅ 05. app_settings table
🔧 06. triggers_and_functions_FIXED.sql  ← USA VERSIÓN FIXED
✅ 07. RLS policies
✅ 08. seed_diet_types
✅ 09. seed_allergen_types
🔧 10. seed_allergen_synonyms_FIXED.sql  ← USA VERSIÓN FIXED
✅ 11. seed_intolerance_types
✅ 12. seed_e_numbers
✅ 13. seed_app_settings
✅ 14. RPC functions
```

---

## ¿Qué Pasa si Ya Aplicaste Algunas?

No hay problema! Las migraciones son **idempotentes** gracias a:
- `CREATE OR REPLACE FUNCTION`
- `DROP TRIGGER IF EXISTS`
- `INSERT ... ON CONFLICT DO NOTHING`
- `CREATE TABLE IF NOT EXISTS`

Simplemente:
1. Limpia los triggers rotos (Paso 1 arriba)
2. Re-aplica las versiones FIXED
3. Listo ✓

---

## Después de Arreglar

Una vez que apliques las versiones FIXED:

```bash
# Regenerar types
npx supabase gen types typescript --project-id <your-ref> > lib/supabase/types.ts
```

Deberías ver:
- `allergen_synonyms` en los types
- `e_numbers` en los types
- `extractions` y `extraction_tokens` en los types
- RPCs: `get_my_profile_payload`, `decide_e_number`, `get_effective_strictness_map`

---

🎯 **Ready to go!** Aplica las versiones FIXED y estarás listo para continuar.
