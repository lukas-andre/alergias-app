-- Migration: Add Row Level Security (RLS) policies for all tables
-- Security model:
-- - Dictionaries: Public read, owner/moderator write
-- - User data: Owner-only access via auth.uid() = user_id
-- - Audit: Owner/moderator read-only

-- Helper function to check if user has a specific role
create or replace function has_role(p_role_key text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from user_roles
    where user_id = auth.uid()
      and role_key = p_role_key
  );
end;
$$;

comment on function has_role(text) is 'Check if current user has the specified role';

-- ========================================
-- DICTIONARIES (Public read, owner write)
-- ========================================

-- diet_types
alter table diet_types enable row level security;

drop policy if exists "diet_types_select_policy" on diet_types;
create policy "diet_types_select_policy"
  on diet_types for select
  using (true);

drop policy if exists "diet_types_insert_policy" on diet_types;
create policy "diet_types_insert_policy"
  on diet_types for insert
  with check (has_role('owner') or has_role('moderator'));

drop policy if exists "diet_types_update_policy" on diet_types;
create policy "diet_types_update_policy"
  on diet_types for update
  using (has_role('owner') or has_role('moderator'));

drop policy if exists "diet_types_delete_policy" on diet_types;
create policy "diet_types_delete_policy"
  on diet_types for delete
  using (has_role('owner'));

-- allergen_types
alter table allergen_types enable row level security;

drop policy if exists "allergen_types_select_policy" on allergen_types;
create policy "allergen_types_select_policy"
  on allergen_types for select
  using (true);

drop policy if exists "allergen_types_insert_policy" on allergen_types;
create policy "allergen_types_insert_policy"
  on allergen_types for insert
  with check (has_role('owner') or has_role('moderator'));

drop policy if exists "allergen_types_update_policy" on allergen_types;
create policy "allergen_types_update_policy"
  on allergen_types for update
  using (has_role('owner') or has_role('moderator'));

drop policy if exists "allergen_types_delete_policy" on allergen_types;
create policy "allergen_types_delete_policy"
  on allergen_types for delete
  using (has_role('owner'));

-- allergen_synonyms
alter table allergen_synonyms enable row level security;

drop policy if exists "allergen_synonyms_select_policy" on allergen_synonyms;
create policy "allergen_synonyms_select_policy"
  on allergen_synonyms for select
  using (true);

drop policy if exists "allergen_synonyms_insert_policy" on allergen_synonyms;
create policy "allergen_synonyms_insert_policy"
  on allergen_synonyms for insert
  with check (has_role('owner') or has_role('moderator'));

drop policy if exists "allergen_synonyms_update_policy" on allergen_synonyms;
create policy "allergen_synonyms_update_policy"
  on allergen_synonyms for update
  using (has_role('owner') or has_role('moderator'));

drop policy if exists "allergen_synonyms_delete_policy" on allergen_synonyms;
create policy "allergen_synonyms_delete_policy"
  on allergen_synonyms for delete
  using (has_role('owner') or has_role('moderator'));

-- intolerance_types
alter table intolerance_types enable row level security;

drop policy if exists "intolerance_types_select_policy" on intolerance_types;
create policy "intolerance_types_select_policy"
  on intolerance_types for select
  using (true);

drop policy if exists "intolerance_types_insert_policy" on intolerance_types;
create policy "intolerance_types_insert_policy"
  on intolerance_types for insert
  with check (has_role('owner') or has_role('moderator'));

drop policy if exists "intolerance_types_update_policy" on intolerance_types;
create policy "intolerance_types_update_policy"
  on intolerance_types for update
  using (has_role('owner') or has_role('moderator'));

drop policy if exists "intolerance_types_delete_policy" on intolerance_types;
create policy "intolerance_types_delete_policy"
  on intolerance_types for delete
  using (has_role('owner'));

-- e_numbers
alter table e_numbers enable row level security;

drop policy if exists "e_numbers_select_policy" on e_numbers;
create policy "e_numbers_select_policy"
  on e_numbers for select
  using (true);

drop policy if exists "e_numbers_insert_policy" on e_numbers;
create policy "e_numbers_insert_policy"
  on e_numbers for insert
  with check (has_role('owner') or has_role('moderator'));

drop policy if exists "e_numbers_update_policy" on e_numbers;
create policy "e_numbers_update_policy"
  on e_numbers for update
  using (has_role('owner') or has_role('moderator'));

drop policy if exists "e_numbers_delete_policy" on e_numbers;
create policy "e_numbers_delete_policy"
  on e_numbers for delete
  using (has_role('owner'));

-- ========================================
-- USER DATA (Owner-only access)
-- ========================================

-- user_profiles
alter table user_profiles enable row level security;

drop policy if exists "user_profiles_select_policy" on user_profiles;
create policy "user_profiles_select_policy"
  on user_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "user_profiles_insert_policy" on user_profiles;
create policy "user_profiles_insert_policy"
  on user_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_update_policy" on user_profiles;
create policy "user_profiles_update_policy"
  on user_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "user_profiles_delete_policy" on user_profiles;
create policy "user_profiles_delete_policy"
  on user_profiles for delete
  using (auth.uid() = user_id);

-- user_profile_diets
alter table user_profile_diets enable row level security;

drop policy if exists "user_profile_diets_all_policy" on user_profile_diets;
create policy "user_profile_diets_all_policy"
  on user_profile_diets for all
  using (auth.uid() = user_id);

-- user_profile_allergens
alter table user_profile_allergens enable row level security;

drop policy if exists "user_profile_allergens_all_policy" on user_profile_allergens;
create policy "user_profile_allergens_all_policy"
  on user_profile_allergens for all
  using (auth.uid() = user_id);

-- user_profile_intolerances
alter table user_profile_intolerances enable row level security;

drop policy if exists "user_profile_intolerances_all_policy" on user_profile_intolerances;
create policy "user_profile_intolerances_all_policy"
  on user_profile_intolerances for all
  using (auth.uid() = user_id);

-- strictness_profiles
alter table strictness_profiles enable row level security;

drop policy if exists "strictness_profiles_all_policy" on strictness_profiles;
create policy "strictness_profiles_all_policy"
  on strictness_profiles for all
  using (auth.uid() = user_id);

-- strictness_overrides (via FK to strictness_profiles)
alter table strictness_overrides enable row level security;

drop policy if exists "strictness_overrides_all_policy" on strictness_overrides;
create policy "strictness_overrides_all_policy"
  on strictness_overrides for all
  using (
    exists (
      select 1
      from strictness_profiles sp
      where sp.id = strictness_overrides.strictness_id
        and sp.user_id = auth.uid()
    )
  );

-- extractions
alter table extractions enable row level security;

drop policy if exists "extractions_all_policy" on extractions;
create policy "extractions_all_policy"
  on extractions for all
  using (auth.uid() = user_id);

-- extraction_tokens (via FK to extractions)
alter table extraction_tokens enable row level security;

drop policy if exists "extraction_tokens_all_policy" on extraction_tokens;
create policy "extraction_tokens_all_policy"
  on extraction_tokens for all
  using (
    exists (
      select 1
      from extractions e
      where e.id = extraction_tokens.extraction_id
        and e.user_id = auth.uid()
    )
  );

-- ========================================
-- AUDIT (Owner/moderator read-only)
-- ========================================

-- dictionary_changes
alter table dictionary_changes enable row level security;

drop policy if exists "dictionary_changes_select_policy" on dictionary_changes;
create policy "dictionary_changes_select_policy"
  on dictionary_changes for select
  using (has_role('owner') or has_role('moderator'));

-- ========================================
-- APP SETTINGS (Owner read/write, public read)
-- ========================================

-- app_settings
alter table app_settings enable row level security;

drop policy if exists "app_settings_select_policy" on app_settings;
create policy "app_settings_select_policy"
  on app_settings for select
  using (true);  -- Public read for feature flags

drop policy if exists "app_settings_insert_policy" on app_settings;
create policy "app_settings_insert_policy"
  on app_settings for insert
  with check (has_role('owner'));

drop policy if exists "app_settings_update_policy" on app_settings;
create policy "app_settings_update_policy"
  on app_settings for update
  using (has_role('owner'));

drop policy if exists "app_settings_delete_policy" on app_settings;
create policy "app_settings_delete_policy"
  on app_settings for delete
  using (has_role('owner'));

-- ========================================
-- ROLES TABLES (self-read, owner manage)
-- ========================================

-- app_roles (public read)
alter table app_roles enable row level security;

drop policy if exists "app_roles_select_policy" on app_roles;
create policy "app_roles_select_policy"
  on app_roles for select
  using (true);

-- user_roles
alter table user_roles enable row level security;

drop policy if exists "user_roles_select_policy" on user_roles;
create policy "user_roles_select_policy"
  on user_roles for select
  using (auth.uid() = user_id or has_role('owner'));

drop policy if exists "user_roles_insert_policy" on user_roles;
create policy "user_roles_insert_policy"
  on user_roles for insert
  with check (has_role('owner'));

drop policy if exists "user_roles_delete_policy" on user_roles;
create policy "user_roles_delete_policy"
  on user_roles for delete
  using (has_role('owner'));
