-- Migration: Add trigger functions for automated data management
-- 1. set_updated_at() - Auto-update updated_at timestamps
-- 2. ensure_default_strictness() - Create default "Diario" strictness profile on user signup
-- 3. grant_owner_role() - Auto-assign owner role to new users
-- 4. log_dictionary_change() - Audit dictionary mutations

-- ====================
-- 1. set_updated_at()
-- ====================
-- Generic trigger function to automatically update the updated_at column
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is 'Trigger function to auto-update updated_at timestamp';

-- Apply to all mutable tables with updated_at column
drop trigger if exists set_updated_at_trigger on user_profiles;
create trigger set_updated_at_trigger
  before update on user_profiles
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on strictness_profiles;
create trigger set_updated_at_trigger
  before update on strictness_profiles
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on diet_types;
create trigger set_updated_at_trigger
  before update on diet_types
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on allergen_types;
create trigger set_updated_at_trigger
  before update on allergen_types
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on intolerance_types;
create trigger set_updated_at_trigger
  before update on intolerance_types
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on e_numbers;
create trigger set_updated_at_trigger
  before update on e_numbers
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on extractions;
create trigger set_updated_at_trigger
  before update on extractions
  for each row
  execute function set_updated_at();

drop trigger if exists set_updated_at_trigger on app_settings;
create trigger set_updated_at_trigger
  before update on app_settings
  for each row
  execute function set_updated_at();

-- ====================
-- 2. ensure_default_strictness()
-- ====================
-- Automatically create a default "Diario" strictness profile when a user profile is created
create or replace function ensure_default_strictness()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_strictness_id uuid;
begin
  -- Only proceed if active_strictness_id is not already set
  if new.active_strictness_id is null then
    -- Create the default "Diario" strictness profile
    insert into strictness_profiles (
      user_id,
      name,
      description,
      block_traces,
      block_same_line,
      e_numbers_uncertain,
      min_model_confidence,
      pediatric_mode,
      anaphylaxis_mode,
      residual_protein_ppm_default
    ) values (
      new.user_id,
      'Diario',
      'Perfil de estrictitud predeterminado para uso diario',
      false,  -- don't block traces by default
      false,  -- don't block same-line by default
      'warn', -- warn on uncertain E-numbers
      0.70,   -- 70% minimum confidence
      false,  -- not pediatric mode by default
      false,  -- not anaphylaxis mode by default
      20      -- 20 ppm residual protein threshold
    )
    returning id into v_strictness_id;

    -- Update the user profile with the new strictness profile ID
    new.active_strictness_id = v_strictness_id;
  end if;

  return new;
end;
$$;

comment on function ensure_default_strictness() is 'Auto-create default "Diario" strictness profile on user signup';

-- Apply trigger to user_profiles
drop trigger if exists ensure_default_strictness_trigger on user_profiles;
create trigger ensure_default_strictness_trigger
  before insert on user_profiles
  for each row
  execute function ensure_default_strictness();

-- ====================
-- 3. grant_owner_role()
-- ====================
-- Automatically grant the "owner" role to new users
create or replace function grant_owner_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert owner role for the new user (ignore if already exists)
  insert into user_roles (user_id, role_key)
  values (new.user_id, 'owner')
  on conflict (user_id, role_key) do nothing;

  return new;
end;
$$;

comment on function grant_owner_role() is 'Auto-grant owner role to new user profiles';

-- Apply trigger to user_profiles
drop trigger if exists grant_owner_role_trigger on user_profiles;
create trigger grant_owner_role_trigger
  after insert on user_profiles
  for each row
  execute function grant_owner_role();

-- ====================
-- 4. log_dictionary_change()
-- ====================
-- Audit trail for dictionary changes (insert, update, delete)
create or replace function log_dictionary_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
  v_action text;
begin
  -- Determine action type
  if TG_OP = 'INSERT' then
    v_action = 'insert';
    v_row_id = new.id;
    v_old_data = null;
    v_new_data = to_jsonb(new);
  elsif TG_OP = 'UPDATE' then
    v_action = 'update';
    v_row_id = new.id;
    v_old_data = to_jsonb(old);
    v_new_data = to_jsonb(new);
  elsif TG_OP = 'DELETE' then
    v_action = 'delete';
    v_row_id = old.id;
    v_old_data = to_jsonb(old);
    v_new_data = null;
  end if;

  -- Insert audit record
  insert into dictionary_changes (
    table_name,
    row_id,
    action,
    old_data,
    new_data,
    changed_by
  ) values (
    TG_TABLE_NAME,
    v_row_id,
    v_action,
    v_old_data,
    v_new_data,
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );

  -- Return appropriate row
  if TG_OP = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

comment on function log_dictionary_change() is 'Audit trigger for dictionary table changes';

-- Apply to dictionary tables
drop trigger if exists log_dictionary_change_trigger on diet_types;
create trigger log_dictionary_change_trigger
  after insert or update or delete on diet_types
  for each row
  execute function log_dictionary_change();

drop trigger if exists log_dictionary_change_trigger on allergen_types;
create trigger log_dictionary_change_trigger
  after insert or update or delete on allergen_types
  for each row
  execute function log_dictionary_change();

drop trigger if exists log_dictionary_change_trigger on intolerance_types;
create trigger log_dictionary_change_trigger
  after insert or update or delete on intolerance_types
  for each row
  execute function log_dictionary_change();

-- Optionally also audit E-numbers and synonyms
drop trigger if exists log_dictionary_change_trigger on e_numbers;
create trigger log_dictionary_change_trigger
  after insert or update or delete on e_numbers
  for each row
  execute function log_dictionary_change();

drop trigger if exists log_dictionary_change_trigger on allergen_synonyms;
create trigger log_dictionary_change_trigger
  after insert or update or delete on allergen_synonyms
  for each row
  execute function log_dictionary_change();
