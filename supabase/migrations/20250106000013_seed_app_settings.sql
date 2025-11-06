-- Migration: Seed app_settings with initial feature flags and configuration
-- These control which features are enabled and global defaults

insert into app_settings (key, value, description) values
  -- Feature toggles (P0)
  ('onboarding.enabled', 'true'::jsonb,
    'Enable/disable onboarding wizard for new users'),

  ('scanner.enabled', 'true'::jsonb,
    'Enable/disable label scanner feature'),

  -- Feature toggles (P1/P2)
  ('menus.enabled', 'false'::jsonb,
    'Enable/disable menu/PDF/URL scanning feature (P1)'),

  ('venues.enabled', 'false'::jsonb,
    'Enable/disable venue map feature (P2)'),

  ('diary.enabled', 'false'::jsonb,
    'Enable/disable food diary feature (P2)'),

  -- Risk engine defaults
  ('risk.default_min_conf', '0.7'::jsonb,
    'Default minimum model confidence threshold (0-1)'),

  ('risk.e_numbers_policy_default', '"warn"'::jsonb,
    'Default policy for uncertain E-numbers: "allow", "warn", or "block"'),

  ('risk.pediatric_mode_default', 'false'::jsonb,
    'Default pediatric mode setting for new strictness profiles'),

  ('risk.anaphylaxis_mode_default', 'false'::jsonb,
    'Default anaphylaxis mode setting for new strictness profiles'),

  -- Backoffice limits
  ('backoffice.import_max_rows', '5000'::jsonb,
    'Maximum rows allowed in CSV/JSON imports'),

  ('backoffice.preview_max_results', '50'::jsonb,
    'Maximum results to show in synonym matching preview'),

  -- Scanner settings
  ('scanner.cache_enabled', 'true'::jsonb,
    'Enable caching by label_hash to avoid duplicate inferences'),

  ('scanner.max_image_size_mb', '10'::jsonb,
    'Maximum image upload size in megabytes'),

  ('scanner.history_max_items', '20'::jsonb,
    'Maximum number of recent scans to show in history'),

  -- Telemetry
  ('telemetry.enabled', 'true'::jsonb,
    'Enable anonymous usage telemetry'),

  ('feedback.enabled', 'true'::jsonb,
    'Enable user feedback/report error functionality')

on conflict (key) do update set
  value = excluded.value,
  description = excluded.description;
