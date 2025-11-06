-- Migration: Add app_settings table for feature flags and configuration
-- Enables runtime toggles for features (onboarding, scanner, menus, venues, diary)
-- and global parameters (default confidence thresholds, E-number policies, etc.)

-- Create app_settings table
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Create index for updated_at to track recent changes
create index if not exists idx_app_settings_updated
  on app_settings(updated_at desc);

-- Create GIN index for JSONB queries on value
create index if not exists idx_app_settings_value
  on app_settings using gin (value);

comment on table app_settings is 'Application-wide feature flags and configuration parameters';
comment on column app_settings.key is 'Setting key (e.g., "scanner.enabled", "risk.default_min_conf")';
comment on column app_settings.value is 'Setting value as JSONB (boolean, number, string, object)';
comment on column app_settings.description is 'Human-readable description of what this setting controls';
comment on column app_settings.updated_by is 'User who last updated this setting (null if system-set)';
