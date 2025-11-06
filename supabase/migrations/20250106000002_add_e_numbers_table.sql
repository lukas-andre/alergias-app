-- Migration: Add e_numbers table for E-code allergen risk evaluation
-- Critical for F04 (Backoffice E-numbers CRUD) and F02 (Scanner risk evaluation)

-- Create e_numbers table
create table if not exists e_numbers (
  code text primary key,
  name_es text not null,
  likely_origins text[] not null default '{}',
  linked_allergen_keys text[] not null default '{}',
  residual_protein_risk boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add CHECK constraint to ensure code format (E followed by digits)
alter table e_numbers
  add constraint ck_e_number_format
  check (code ~ '^E[0-9]+[a-z]*$');

-- Create index on code for fast lookups (though PK already provides this)
-- This is explicit for documentation purposes
create index if not exists idx_e_numbers_code on e_numbers(code);

-- Create GIN index for array containment searches on linked_allergen_keys
create index if not exists idx_e_numbers_linked_allergens
  on e_numbers using gin (linked_allergen_keys);

comment on table e_numbers is 'E-number additives with allergen risk information';
comment on column e_numbers.code is 'E-number code (e.g., E322, E471, E120)';
comment on column e_numbers.name_es is 'Spanish name of the additive';
comment on column e_numbers.likely_origins is 'Array of typical origins (e.g., ["soja", "huevo", "vegetal"])';
comment on column e_numbers.linked_allergen_keys is 'Array of allergen keys this E-number may contain (e.g., ["soy", "egg"])';
comment on column e_numbers.residual_protein_risk is 'Whether refined versions may still contain trace proteins';
comment on column e_numbers.notes is 'Additional notes about ambiguity, regional variations, or context';
