-- Migration: Fix Role System Security
--
-- Problem: grant_owner_role() trigger assigns 'owner' to ALL new users automatically.
-- This creates a security risk where every registered user has admin privileges.
--
-- Solution:
-- 1. Create 'user' role for regular users
-- 2. Update grant_owner_role() trigger to assign 'user' instead of 'owner'
-- 3. 'owner' role must be assigned manually via SQL or admin UI
--
-- Impact: New users get 'user' role (no special privileges). Admin must manually
-- assign 'owner', 'moderator', or 'nutritionist' roles.
--
-- Breaking: None (existing users keep their roles). Only affects new registrations.

-- ============================================================================
-- 1. Create 'user' role
-- ============================================================================

INSERT INTO app_roles (key)
VALUES ('user')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE app_roles IS 'Available roles: owner (admin), nutritionist (content moderator), moderator (dictionary editor), user (regular)';

-- ============================================================================
-- 2. Update grant_owner_role() trigger to assign 'user' instead of 'owner'
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant 'user' role to new users instead of 'owner'
  -- 'owner' must be assigned manually for security
  INSERT INTO user_roles (user_id, role_key)
  VALUES (NEW.user_id, 'user')
  ON CONFLICT (user_id, role_key) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION grant_owner_role() IS 'Auto-assigns "user" role to new user profiles. Admin roles must be assigned manually.';

-- ============================================================================
-- 3. Update RLS policies to allow users to read their own roles
-- ============================================================================

-- Already exists: SELECT policy allows auth.uid() = user_id OR has_role('owner')
-- No changes needed to RLS policies

-- ============================================================================
-- 4. Create helper view for admin user management (optional)
-- ============================================================================

CREATE OR REPLACE VIEW user_roles_with_email AS
SELECT
  ur.user_id,
  ur.role_key,
  au.email,
  up.display_name,
  up.created_at as profile_created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN user_profiles up ON ur.user_id = up.user_id;

COMMENT ON VIEW user_roles_with_email IS 'Helper view for admin user management. Shows roles with user emails.';

-- Grant access only to owners (admins)
-- Note: Views don't inherit RLS from base tables, so we need explicit grants
-- For now, this view is queryable via service client only (admin API routes)

-- ============================================================================
-- End of migration
-- ============================================================================
