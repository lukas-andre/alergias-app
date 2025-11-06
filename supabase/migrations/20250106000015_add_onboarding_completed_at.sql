-- Migration: Add onboarding_completed_at to user_profiles
-- Purpose: Track when users complete the 7-step onboarding wizard
-- This allows us to show the onboarding experience only once per user

-- Add onboarding_completed_at column
alter table user_profiles
  add column onboarding_completed_at timestamptz default null;

-- Add comment explaining the field
comment on column user_profiles.onboarding_completed_at is
  'Timestamp when the user completed the 7-step onboarding wizard. NULL indicates onboarding is incomplete or in progress.';

-- Create index for efficient queries checking onboarding status
create index idx_user_profiles_onboarding_status on user_profiles(onboarding_completed_at)
  where onboarding_completed_at is null;

comment on index idx_user_profiles_onboarding_status is
  'Partial index for efficiently finding users who have not completed onboarding';
