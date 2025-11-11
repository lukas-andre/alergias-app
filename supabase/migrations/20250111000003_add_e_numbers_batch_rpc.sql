-- Migration: Add batch RPC function for E-number risk evaluation
-- decide_e_numbers_batch() - Batch version of decide_e_number()
--
-- Performance: Reduces N round trips to 1 for evaluating multiple E-numbers
-- Expected improvement: 500ms → 50ms for 10 E-numbers

-- ========================================
-- decide_e_numbers_batch()
-- ========================================
-- Determines risk policy for multiple E-numbers in a single call
-- Returns array of JSON objects with same structure as decide_e_number()
create or replace function decide_e_numbers_batch(
  p_user_id uuid,
  p_codes text[]
)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_allergens text[];
  v_policy text;
  v_result json[];
  v_code text;
  v_e_number record;
  v_matched_allergens text[];
  v_final_policy text;
begin
  -- Get user's allergen keys once (shared across all E-numbers)
  select array_agg(a.key)
  into v_user_allergens
  from user_profile_allergens upa
  join allergen_types a on a.id = upa.allergen_id
  where upa.user_id = p_user_id;

  -- Get user's e_numbers_uncertain policy once
  select coalesce(sp.e_numbers_uncertain, 'warn')
  into v_policy
  from user_profiles up
  left join strictness_profiles sp on sp.id = up.active_strictness_id
  where up.user_id = p_user_id;

  -- Process each E-number code
  foreach v_code in array p_codes
  loop
    -- Get E-number details
    select *
    into v_e_number
    from e_numbers
    where code = v_code;

    -- If E-number doesn't exist, add unknown result
    if not found then
      v_result := array_append(v_result, json_build_object(
        'policy', 'unknown',
        'code', v_code,
        'exists', false
      ));
      continue;
    end if;

    -- If user has no allergens, allow by default
    if v_user_allergens is null or array_length(v_user_allergens, 1) = 0 then
      v_result := array_append(v_result, json_build_object(
        'policy', 'allow',
        'code', v_code,
        'name_es', v_e_number.name_es,
        'linked_allergens', v_e_number.linked_allergen_keys,
        'matched_allergens', ARRAY[]::text[],
        'residual_protein_risk', v_e_number.residual_protein_risk,
        'reason', 'No allergens in user profile'
      ));
      continue;
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

      v_result := array_append(v_result, json_build_object(
        'policy', v_final_policy,
        'code', v_code,
        'name_es', v_e_number.name_es,
        'linked_allergens', v_e_number.linked_allergen_keys,
        'matched_allergens', v_matched_allergens,
        'residual_protein_risk', v_e_number.residual_protein_risk,
        'reason', 'E-number linked to user allergen(s): ' || array_to_string(v_matched_allergens, ', ')
      ));
      continue;
    end if;

    -- No direct allergen match, apply user's e_numbers_uncertain policy
    v_result := array_append(v_result, json_build_object(
      'policy', coalesce(v_policy, 'warn'),
      'code', v_code,
      'name_es', v_e_number.name_es,
      'linked_allergens', v_e_number.linked_allergen_keys,
      'matched_allergens', ARRAY[]::text[],
      'residual_protein_risk', v_e_number.residual_protein_risk,
      'likely_origins', v_e_number.likely_origins,
      'reason', 'No allergen match; applying e_numbers_uncertain policy: ' || coalesce(v_policy, 'warn')
    ));
  end loop;

  -- Return array as JSON
  return array_to_json(coalesce(v_result, ARRAY[]::json[]));
end;
$$;

comment on function decide_e_numbers_batch(uuid, text[]) is 'Batch evaluate E-number risks for user (reduces N calls to 1)';
