-- ============================================================================
-- Script: Create Admin User
-- ============================================================================
--
-- Purpose: Manually grant 'owner' role to a user to make them an admin.
--
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Find your user's UUID by running the query in STEP 1
-- 3. Copy the UUID
-- 4. Replace 'YOUR_EMAIL_HERE' in STEP 2 with your actual email
-- 5. Run STEP 2 to grant owner role
-- 6. Verify with STEP 3
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Find your user UUID
-- ============================================================================
-- Run this first to get your user ID:

SELECT
  id as user_id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your actual email

-- Example result:
-- user_id                              | email              | created_at          | confirmed_at
-- ----------------------------------------------------------------------------------------------------
-- 123e4567-e89b-12d3-a456-426614174000 | tu@email.com       | 2025-01-22 10:00:00 | 2025-01-22 10:05:00


-- ============================================================================
-- STEP 2: Grant owner role
-- ============================================================================
-- Replace 'YOUR_EMAIL_HERE' with your actual email:

INSERT INTO user_roles (user_id, role_key)
SELECT
  id,
  'owner'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
ON CONFLICT (user_id, role_key) DO NOTHING;

-- Expected result: INSERT 0 1 (means 1 row inserted)


-- ============================================================================
-- STEP 3: Verify admin role was granted
-- ============================================================================
-- Check that your user now has the owner role:

SELECT
  au.email,
  ur.role_key,
  ur.user_id
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
ORDER BY ur.role_key;

-- Expected result:
-- email              | role_key | user_id
-- -------------------------------------------------------
-- tu@email.com       | owner    | 123e4567-e89b-12d3-a456-426614174000
-- tu@email.com       | user     | 123e4567-e89b-12d3-a456-426614174000

-- You should see TWO rows: one for 'user' (auto-assigned) and one for 'owner' (just added)


-- ============================================================================
-- STEP 4 (Optional): Grant additional roles to other users
-- ============================================================================
-- To make another user a moderator or nutritionist:

-- INSERT INTO user_roles (user_id, role_key)
-- SELECT
--   id,
--   'moderator'  -- or 'nutritionist'
-- FROM auth.users
-- WHERE email = 'OTHER_USER_EMAIL_HERE'
-- ON CONFLICT (user_id, role_key) DO NOTHING;


-- ============================================================================
-- Role Hierarchy
-- ============================================================================
--
-- 'owner'       = Full admin access (all CRUD operations, user management)
-- 'moderator'   = Dictionary management (allergens, e-numbers, diets, etc.)
-- 'nutritionist'= Content review (future: approve venue submissions, recipes)
-- 'user'        = Regular user (auto-assigned to all new users)
--
-- RLS Permissions:
-- - Dictionaries (allergen_types, diet_types, etc.):
--   - Read: Everyone
--   - Write: owner OR moderator
--   - Delete: owner only
--
-- - User Roles:
--   - Read: Self OR owner
--   - Write/Delete: owner only
--
-- - App Settings:
--   - Read: Everyone
--   - Write/Delete: owner only
--
-- ============================================================================
