# Fixes Applied to Migrations

## Problems Encountered

### 1. ❌ Error in `20250106000006_add_triggers_and_functions.sql`

**Error:**
```
ERROR: 42703: record "new" has no field "updated_at"
CONTEXT: PL/pgSQL function set_updated_at() line 3 at assignment
```

**Cause:** The `set_updated_at()` trigger was applied to tables that don't have an `updated_at` column (like `diet_types`, `allergen_types`, `intolerance_types`).

**Fix:** Use `20250106000006_add_triggers_and_functions_FIXED.sql` instead

This version only applies the trigger to tables that HAVE `updated_at`:
- ✅ `user_profiles`
- ✅ `strictness_profiles`
- ✅ `extractions`
- ✅ `app_settings`
- ✅ `e_numbers`

**NOT applied to:**
- ❌ `diet_types` (no updated_at column in current schema)
- ❌ `allergen_types` (no updated_at column in current schema)
- ❌ `intolerance_types` (no updated_at column in current schema)

If you want to add `updated_at` to dictionary tables, run:
```sql
ALTER TABLE diet_types ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE allergen_types ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE intolerance_types ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
```

Then uncomment the trigger creation sections in the migration file.

---

### 2. ❌ Error in `20250106000010_seed_allergen_synonyms.sql`

**Error:**
```
ERROR: 23502: null value in column "allergen_id" violates not-null constraint
DETAIL: Failing row contains (..., null, crustáceos, es-CL, 3, ...)
CONTEXT: SQL statement "insert into allergen_synonyms ..."
```

**Cause:** The original migration used `SELECT id INTO v_crustaceos FROM allergen_types WHERE key = 'crustaceos'` which returns NULL if the key doesn't exist. The variables were then NULL when inserting synonyms.

**Fix:** Use `20250106000010_seed_allergen_synonyms_FIXED.sql` instead

This version:
1. Checks `if exists (select 1 from allergen_types where key = 'XXX')` before each section
2. Uses `LATERAL` join pattern that's safer and doesn't require variables
3. Gracefully handles missing allergen_types (just skips those synonyms)

---

## How to Apply Fixes

### Option 1: Replace the Files and Re-run

1. Delete the old versions:
   ```bash
   rm supabase/migrations/20250106000006_add_triggers_and_functions.sql
   rm supabase/migrations/20250106000010_seed_allergen_synonyms.sql
   ```

2. Rename the fixed versions:
   ```bash
   mv supabase/migrations/20250106000006_add_triggers_and_functions_FIXED.sql \
      supabase/migrations/20250106000006_add_triggers_and_functions.sql

   mv supabase/migrations/20250106000010_seed_allergen_synonyms_FIXED.sql \
      supabase/migrations/20250106000010_seed_allergen_synonyms.sql
   ```

3. Drop the failed triggers and re-run:
   ```sql
   -- Drop failed triggers
   DROP TRIGGER IF EXISTS set_updated_at_trigger ON diet_types;
   DROP TRIGGER IF EXISTS set_updated_at_trigger ON allergen_types;
   DROP TRIGGER IF EXISTS set_updated_at_trigger ON intolerance_types;
   ```

4. Re-apply both migrations via Supabase Dashboard SQL Editor

### Option 2: Just Run the FIXED Versions

1. Run `20250106000006_add_triggers_and_functions_FIXED.sql` directly in SQL Editor
2. Run `20250106000010_seed_allergen_synonyms_FIXED.sql` directly in SQL Editor

The `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS` statements make them safe to re-run.

---

## Verification

After applying fixes:

```sql
-- 1. Check triggers exist on correct tables
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'set_updated_at_trigger'
ORDER BY event_object_table;

-- Should return:
-- set_updated_at_trigger | app_settings
-- set_updated_at_trigger | e_numbers
-- set_updated_at_trigger | extractions
-- set_updated_at_trigger | strictness_profiles
-- set_updated_at_trigger | user_profiles

-- 2. Check synonym count
SELECT COUNT(*) FROM allergen_synonyms;
-- Should be ~100-200 depending on how many allergen_types exist

-- 3. Check synonyms per allergen
SELECT a.key, a.name_es, COUNT(s.id) as synonym_count
FROM allergen_types a
LEFT JOIN allergen_synonyms s ON s.allergen_id = a.id
GROUP BY a.id, a.key, a.name_es
ORDER BY synonym_count DESC;
```

---

## Summary

✅ **All other migrations (12/14) ran successfully**

⚠️ **2 migrations needed fixes:**
- Migration 06 (triggers) - FIXED ✓
- Migration 10 (synonyms) - FIXED ✓

**Root causes:**
1. Applied triggers to tables without the expected column
2. Used unsafe variable assignment that could result in NULL

**Solutions applied:**
1. Conditional trigger application based on schema
2. Safe `EXISTS` checks + `LATERAL` joins for synonyms

🎯 **Status:** Ready to re-run with fixed versions
