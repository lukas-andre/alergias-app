-- Migration: Add RPC functions for profile and E-number risk evaluation
-- 1. get_my_profile_payload() - Security wrapper for current user
-- 2. decide_e_number() - E-number risk policy decision
-- 3. get_effective_strictness_map() - Batch strictness lookup (P1 optimization)

-- ========================================
-- 1. get_my_profile_payload()
-- ========================================
-- Security definer wrapper around get_profile_payload(auth.uid())
-- This ensures users can only fetch their own profile
create or replace function get_my_profile_payload()
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Call existing get_profile_payload with current user's ID
  return get_profile_payload(auth.uid());
end;
$$;

comment on function get_my_profile_payload() is 'Fetch complete profile payload for authenticated user (security definer wrapper)';

-- ========================================
-- 2. decide_e_number()
-- ========================================
-- Determines if an E-number is safe, warn, or block based on:
-- - E-number's linked_allergen_keys
-- - User's allergen profile
-- - User's active strictness e_numbers_uncertain policy
-- - Residual protein risk flag
create or replace function decide_e_number(
  p_user_id uuid,
  p_code text
)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_e_number record;
  v_user_allergens text[];
  v_policy text;
  v_linked_allergens text[];
  v_matched_allergens text[];
  v_residual_risk boolean;
  v_final_policy text;
begin
  -- Get E-number details
  select *
  into v_e_number
  from e_numbers
  where code = p_code;

  -- If E-number doesn't exist, return unknown
  if not found then
    return json_build_object(
      'policy', 'unknown',
      'code', p_code,
      'exists', false
    );
  end if;

  -- Get user's allergen keys
  select array_agg(a.key)
  into v_user_allergens
  from user_profile_allergens upa
  join allergen_types a on a.id = upa.allergen_id
  where upa.user_id = p_user_id;

  -- If user has no allergens, allow by default
  if v_user_allergens is null or array_length(v_user_allergens, 1) = 0 then
    return json_build_object(
      'policy', 'allow',
      'code', p_code,
      'name_es', v_e_number.name_es,
      'linked_allergens', v_e_number.linked_allergen_keys,
      'matched_allergens', ARRAY[]::text[],
      'residual_protein_risk', v_e_number.residual_protein_risk,
      'reason', 'No allergens in user profile'
    );
  end if;

  -- Check if any of the E-number's linked allergens match user's allergens
  select array_agg(elem)
  into v_matched_allergens
  from unnest(v_e_number.linked_allergen_keys) elem
  where elem = any(v_user_allergens);

  -- If there are matched allergens, it's a direct risk
  if v_matched_allergens is not null and array_length(v_matched_allergens, 1) > 0 then
    -- Check if residual protein risk flag is set
    if v_e_number.residual_protein_risk then
      v_final_policy = 'block';
    else
      v_final_policy = 'warn';
    end if;

    return json_build_object(
      'policy', v_final_policy,
      'code', p_code,
      'name_es', v_e_number.name_es,
      'linked_allergens', v_e_number.linked_allergen_keys,
      'matched_allergens', v_matched_allergens,
      'residual_protein_risk', v_e_number.residual_protein_risk,
      'reason', 'E-number linked to user allergen(s): ' || array_to_string(v_matched_allergens, ', ')
    );
  end if;

  -- No direct allergen match, check user's e_numbers_uncertain policy
  select coalesce(sp.e_numbers_uncertain, 'warn')
  into v_policy
  from user_profiles up
  left join strictness_profiles sp on sp.id = up.active_strictness_id
  where up.user_id = p_user_id;

  -- Apply user's policy for uncertain E-numbers
  return json_build_object(
    'policy', coalesce(v_policy, 'warn'),
    'code', p_code,
    'name_es', v_e_number.name_es,
    'linked_allergens', v_e_number.linked_allergen_keys,
    'matched_allergens', ARRAY[]::text[],
    'residual_protein_risk', v_e_number.residual_protein_risk,
    'likely_origins', v_e_number.likely_origins,
    'reason', 'No allergen match; applying e_numbers_uncertain policy: ' || coalesce(v_policy, 'warn')
  );
end;
$$;

comment on function decide_e_number(uuid, text) is 'Evaluate E-number risk for user based on allergen profile and strictness settings';

-- ========================================
-- 3. get_effective_strictness_map()
-- ========================================
-- Returns a map of {allergen_key => effective_strictness_settings} for all user allergens
-- This is a P1 optimization to avoid N RPC calls (one per allergen)
create or replace function get_effective_strictness_map(
  p_user_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_active_strictness_id uuid;
  v_base_strictness record;
  v_result json;
begin
  -- Get active strictness profile ID
  select active_strictness_id
  into v_active_strictness_id
  from user_profiles
  where user_id = p_user_id;

  -- If no active strictness, return empty map
  if v_active_strictness_id is null then
    return '{}'::json;
  end if;

  -- Get base strictness settings
  select *
  into v_base_strictness
  from strictness_profiles
  where id = v_active_strictness_id;

  -- Build map of allergen_key => effective settings
  -- For each user allergen, apply overrides if they exist
  select json_object_agg(
    a.key,
    json_build_object(
      'block_traces', coalesce(so.block_traces, v_base_strictness.block_traces),
      'block_same_line', coalesce(so.block_same_line, v_base_strictness.block_same_line),
      'e_numbers_uncertain', coalesce(so.e_numbers_uncertain, v_base_strictness.e_numbers_uncertain),
      'residual_protein_ppm', coalesce(so.residual_protein_ppm, v_base_strictness.residual_protein_ppm_default),
      'has_override', (so.strictness_id is not null)
    )
  )
  into v_result
  from user_profile_allergens upa
  join allergen_types a on a.id = upa.allergen_id
  left join strictness_overrides so
    on so.strictness_id = v_active_strictness_id
    and so.allergen_id = upa.allergen_id
  where upa.user_id = p_user_id;

  return coalesce(v_result, '{}'::json);
end;
$$;

comment on function get_effective_strictness_map(uuid) is 'Get effective strictness settings for all user allergens in one call (P1 optimization)';
