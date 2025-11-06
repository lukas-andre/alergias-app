# Supabase Migrations Guide

## Overview

This directory contains 14 migrations that establish the complete P0 database foundation for AlergiasCL. These migrations add missing tables, triggers, RLS policies, and seed data as specified in `docs/TRACK.md`.

## Migration Files (Apply in Order)

1. **20250106000001_add_allergen_synonyms_table.sql**
   - Creates `allergen_synonyms` table (replaces `synonyms[]` array)
   - Migrates existing synonym data
   - Adds trigram indices for fuzzy search

2. **20250106000002_add_e_numbers_table.sql**
   - Creates `e_numbers` table for E-code risk evaluation
   - Adds indices for fast lookups

3. **20250106000003_add_extractions_table.sql**
   - Creates `extractions` table for OCR/Vision results
   - Enables scanner persistence and caching

4. **20250106000004_add_extraction_tokens_table.sql**
   - Creates `extraction_tokens` for granular evidence
   - Token-level explainability for risk assessments

5. **20250106000005_add_app_settings_table.sql**
   - Creates `app_settings` for feature flags
   - Runtime configuration management

6. **20250106000006_add_triggers_and_functions.sql**
   - `set_updated_at()` - Auto-update timestamps
   - `ensure_default_strictness()` - Auto-create "Diario" profile
   - `grant_owner_role()` - Auto-assign owner role
   - `log_dictionary_change()` - Audit dictionary changes

7. **20250106000007_add_rls_policies.sql**
   - RLS policies for all tables
   - Dictionaries: public read, owner/moderator write
   - User data: owner-only access
   - Includes `has_role()` helper function

8. **20250106000008_seed_diet_types.sql**
   - Seeds 15 common diets (vegano, celíaco, etc.)

9. **20250106000009_seed_allergen_types.sql**
   - Seeds EU's 14 major allergens
   - Chilean-specific notes

10. **20250106000010_seed_allergen_synonyms.sql**
    - Seeds 200+ synonym variations
    - Chilean Spanish + English terms
    - Weighted for search relevance

11. **20250106000011_seed_intolerance_types.sql**
    - Seeds 8 common intolerances

12. **20250106000012_seed_e_numbers.sql**
    - Seeds 25 critical E-codes
    - Focus on ambiguous additives (E322, E471, E1105, etc.)
    - Includes allergen links and risk flags

13. **20250106000013_seed_app_settings.sql**
    - Seeds initial feature flags
    - Default risk thresholds
    - Backoffice limits

14. **20250106000014_add_rpc_functions.sql**
    - `get_my_profile_payload()` - Security wrapper
    - `decide_e_number()` - E-code risk evaluation
    - `get_effective_strictness_map()` - Batch strictness lookup

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. For each migration file (in order):
   - Open the file
   - Copy the entire SQL content
   - Paste into SQL Editor
   - Click "Run"
   - Verify success message

### Option 2: Supabase CLI

If you have Supabase CLI configured:

```bash
# Apply all migrations in order
for file in supabase/migrations/*.sql; do
  echo "Applying $file..."
  supabase db push --file "$file"
done
```

### Option 3: MCP Supabase Tool (If Configured)

If you've configured Supabase MCP with access token:

```bash
# Use MCP tool to apply each migration
# (requires SUPABASE_ACCESS_TOKEN configured)
```

## Verification Steps

After applying all migrations:

1. **Check tables exist:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Verify seed data:**
   ```sql
   SELECT COUNT(*) FROM diet_types;        -- Should be 15
   SELECT COUNT(*) FROM allergen_types;    -- Should be 14
   SELECT COUNT(*) FROM allergen_synonyms; -- Should be ~200
   SELECT COUNT(*) FROM e_numbers;         -- Should be 25
   SELECT COUNT(*) FROM app_settings;      -- Should be ~16
   ```

3. **Test triggers:**
   ```sql
   -- Create test user profile (should auto-create strictness + role)
   INSERT INTO user_profiles (user_id, display_name)
   VALUES (auth.uid(), 'Test User');

   -- Verify strictness was created
   SELECT * FROM strictness_profiles WHERE user_id = auth.uid();

   -- Verify owner role was granted
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```

4. **Test RPCs:**
   ```sql
   SELECT get_my_profile_payload();
   SELECT decide_e_number(auth.uid(), 'E322');
   SELECT get_effective_strictness_map(auth.uid());
   ```

5. **Test RLS policies:**
   ```sql
   -- As authenticated user, should only see own data
   SELECT * FROM user_profiles; -- Should return only your profile

   -- Should see all dictionaries
   SELECT * FROM allergen_types; -- Should return all 14
   ```

## Next Steps After Migration

1. **Regenerate TypeScript types:**
   ```bash
   npx supabase gen types typescript --project-id <your-ref> > lib/supabase/types.ts
   ```

2. **Update TRACK.md** - Check off completed items:
   - Section 0: Preparación / Infra ✓
   - Section 1: Migraciones DB + RLS ✓
   - Section 2: RPCs / Server ✓

3. **Start implementing P0 features:**
   - Refactor onboarding to use `allergen_synonyms` trigram search
   - Update scanner to persist to `extractions`/`extraction_tokens`
   - Implement backoffice for dictionaries/E-numbers

## Troubleshooting

### "relation already exists" errors
- These are safe to ignore if using `if not exists`
- Or drop the table first: `DROP TABLE IF EXISTS table_name CASCADE;`

### "column does not exist" errors
- Check that you're applying migrations in order
- Ensure previous migrations completed successfully

### RLS policy errors
- Verify you're authenticated: `SELECT auth.uid();`
- Check role assignments: `SELECT * FROM user_roles WHERE user_id = auth.uid();`

### Trigger not firing
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE '%your_trigger%';`
- Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'your_function';`

## Migration History

Track applied migrations in Supabase migrations table:
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;
```
