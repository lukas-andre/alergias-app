# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Nutrición para Alergias**, a Next.js MVP that scans Chilean food product labels using OpenAI's Vision API with structured JSON responses. It evaluates allergen risk by combining OpenAI's ingredient extraction with personalized user profiles stored in Supabase.

**Core flow:** User captures a product label → OpenAI extracts ingredients/allergens → Risk engine combines results with user profile → Display risk assessment with suggested actions.

## Development Commands

```bash
# Development server (default port 3000)
npm run dev

# Production build
npm run build

# Run production build
npm run start

# Lint with ESLint
npm run lint
```

## Environment Setup

Required environment variables (see `.env.example`):

- `OPENAI_API_KEY` - Required for vision analysis
- `OPENAI_MODEL` - Optional, defaults to `gpt-4o-mini`
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (client-side safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `DATABASE_PASSWORD` - Database password
- `SUPABASE_JWT_SECRET` - Optional, for webhook validation

## Architecture

### 1. OpenAI Integration (`lib/openai/`)

**Vision API with Structured Responses:**
- `vision.ts:extractIngredientsJSONViaSDK()` - Main entry point using OpenAI Responses API
- Uses `response_format: json_schema` with strict validation (lines 47-93 in `vision.ts`)
- Returns typed `IngredientsResult` with: ingredients array, detected_allergens, confidence, source_language, ocr_text, warnings
- Schema enforces Chilean Spanish locale (`es-CL`)
- System prompt instructs model to process entire label (not just ingredients block) and extract allergen warnings from any section

**Cost Estimation:**
- `cost-estimator.ts` - Dynamic tile-based token calculation following OpenAI pricing rules
- Pre-flight estimation uses image dimensions (if available)
- Post-flight actual cost calculated from `usage` object returned by API
- Model pricing keys: `gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`

### 2. Supabase Architecture (`lib/supabase/`)

**Client Creation Patterns:**
- `browser.ts` - Client-side using `createBrowserClient` from `@supabase/ssr`
- `server.ts` - Server-side (App Router) using `createServerClient` with cookie handling
- `service.ts` - Service role client for admin operations (bypasses RLS)

**Critical: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.**

**Database Schema (`types.ts`):**
- `user_profiles` - Base profile with `active_strictness_id` reference
- `strictness_profiles` - Named strictness modes (e.g., "Diario", "Pediátrico") with global rules
- `strictness_overrides` - Per-allergen overrides (block_traces, e_numbers_uncertain, residual_protein_ppm, etc.)
- `user_profile_allergens` - Many-to-many with severity (0-3, where 3=anaphylaxis)
- `user_profile_intolerances` - Many-to-many with severity
- `user_profile_diets` - Many-to-many diet associations
- Dictionary tables: `allergen_types`, `intolerance_types`, `diet_types` (with synonyms arrays)

**Key RPC Functions:**
- `get_profile_payload(p_user_id)` - Single-call fetch of complete user profile with diets, allergens, intolerances, active strictness, and overrides
- `get_effective_strictness(p_user_id, p_allergen_key)` - Computes merged strictness for specific allergen

**RLS Policies:**
- All user data: owner-only access via `auth.uid() = user_id`
- Dictionaries: public read access
- Strictness overrides: scoped via existence check on `strictness_profiles`

### 3. Risk Evaluation Engine (`lib/risk/evaluate.ts`)

**Core Function: `evaluateRisk(analysis, profile)`**

Combines OpenAI's `IngredientsResult` with Supabase `ProfilePayload` to produce `RiskAssessment`.

**Risk Levels:** `low` | `medium` | `high`

**Reason Types:**
- `contains` - Allergen directly in ingredient list
- `trace` - "Puede contener" / "Trazas de" detected (lines 52-72)
- `same_line` - "Misma línea" / "Instalación compartida" detected (lines 74-94)
- `low_confidence` - Model confidence below `min_model_confidence` threshold
- `e_number_uncertain` - E-number with uncertain origin matching user allergen

**Strictness Application (lines 20-50):**
1. Fetch base strictness profile
2. Apply allergen-specific override if exists
3. Compute effective rules: `block_traces`, `block_same_line`, `e_numbers_uncertain`, `residual_protein_ppm`
4. Special modes: `pediatric_mode`, `anaphylaxis_mode`

**Risk Escalation Logic:**
- Severity ≥2 → base `high`
- Severity ≥3 → always `high`
- `anaphylaxis_mode=true` → all allergen matches become `high`
- `block_traces=true` → trace warnings become `high` (otherwise `medium`)
- `block_same_line=true` → same-line warnings become `high` (otherwise `medium`)

**Token Detection:**
- Uses regex patterns to extract trace/same-line warnings from `ocr_text`, `warnings`, and `detected_allergens`
- Normalizes allergen keys for matching (NFD normalization, accent removal, slug conversion at lines 8-13)

### 4. API Routes

**`/api/analyze` (POST):**
1. Accept multipart form: `image` (File), `width`, `height` (optional dimensions)
2. Convert to base64 data URL
3. Call `extractIngredientsJSONViaSDK()`
4. Fetch user session/profile from Supabase (lines 63-81)
5. If authenticated, run `evaluateRisk()` with profile
6. Return combined payload: `{ data, tokensUSD, usage, estimatedCost, model, profile, risk }`

**`/api/profile` (GET):**
- Returns `get_profile_payload` RPC result for authenticated user
- Used by profile wizard and risk evaluation

### 5. Session Management

**App Router Pattern (`app/layout.tsx`):**
1. Create server Supabase client in layout
2. Fetch session via `supabase.auth.getSession()`
3. Pass `initialSession` to `<SupabaseProvider>`
4. Provider hydrates client-side session and exposes `useSupabase()` hook

**Authentication Flow:**
- Email/password via Supabase Auth
- Auto-create user profile via `ensure_default_strictness()` trigger (creates "Diario" strictness profile)
- Wizard at `/profile` for completing diets/allergens/intolerances/strictness

### 6. Profile Wizard (`/profile`)

Multi-step flow:
1. Auth gate (sign in with email/password)
2. Select diets (multi-select)
3. Select allergens with severity (0-3) and optional notes
4. Select intolerances with severity
5. Configure active strictness profile settings
6. Define per-allergen overrides (traces, same-line, e-numbers, ppm, notes)

Uses `useSupabase()` hook for all mutations.

### 7. Image Scanning Flow (`/scan`)

1. `ImagePicker.tsx` - Handles file input with `capture="environment"` for mobile camera
2. Measures image dimensions via `Image()` object before upload
3. Sends to `/api/analyze` with FormData
4. `AnalysisResult.tsx` - Displays:
   - Ingredient chips
   - Allergen badges
   - Warnings
   - Confidence score
   - Risk assessment (if authenticated)
   - Cost metrics (estimated vs actual)
   - Expandable raw JSON/usage panels

## Key Implementation Patterns

### Type Safety
- All Supabase clients typed with `Database` from `types.ts`
- OpenAI responses parsed to `IngredientsResult` interface
- Risk engine uses `ProfilePayload` and `RiskAssessment` types from `lib/risk/types.ts`

### Error Handling
- OpenAI calls: try/catch with JSON fallback (handles markdown code blocks at lines 162-167 in `vision.ts`)
- Supabase profile fetch: non-blocking - if profile unavailable, proceed without risk evaluation (lines 79-81 in `app/api/analyze/route.ts`)
- Cost estimation: returns `null` if dimensions unavailable (no hard failure)

### Cost Transparency
- Pre-upload estimation displayed to user
- Post-analysis actual cost shown
- Usage object preserved for audit (`prompt_tokens`, `completion_tokens`, `total_tokens`)

### Risk Display Strategy
- Low risk: green, "Guardar" action
- Medium risk: yellow, "Guardar" + "Pedir verificación"
- High risk: red, "Ver alternativas" + "Pedir verificación"

## Common Development Tasks

### Regenerate Supabase Types
When database schema changes:
```bash
npx supabase gen types typescript --project-id <your-ref> --schema public > lib/supabase/types.ts
```

### Test OpenAI Integration Locally
Ensure `.env.local` has `OPENAI_API_KEY`, then:
```bash
npm run dev
# Visit http://localhost:3000/scan
# Upload test product label image
```

### Debug Risk Evaluation
1. Check user profile exists: query `/api/profile`
2. Verify active strictness profile is set
3. Inspect `evaluateRisk()` reasons array for decision path
4. Compare `detected_allergens` from OpenAI with `user_profile_allergens`

### Add New Allergen Synonym
Update seed in Supabase migration (see `docs/FIRST_STEPS.md` lines 369-452 for examples):
```sql
UPDATE allergen_types
SET synonyms = array['existing', 'new_synonym']
WHERE key='allergen_key';
```

## Testing Strategy

- Manual testing with ≥5 real Chilean product labels
- Compare OpenAI extracted allergens vs manual reading
- Verify cost estimates within 10% of actual
- Test risk escalation with different strictness profiles
- Validate trace/same-line token detection with edge cases

## Important Notes

- **Locale:** All prompts and UI assume `es-CL` (Chilean Spanish)
- **Model Selection:** Default `gpt-4o-mini` balances cost/quality; override via `OPENAI_MODEL` env var
- **RLS Security:** All profile data isolated per user; dictionary tables public-read
- **Strictness Philosophy:** Overrides allow per-allergen fine-tuning without duplicating entire profiles
- **Token Matching:** Uses NFD normalization + accent stripping for robust allergen key matching (critical for Spanish text)
- **Pricing Model:** Uses `response_format` with `json_schema` and `strict: true` - ensure cost estimator reflects this overhead

## Future Enhancements (Referenced in PROGRESS.md)

- Persistence/history (localStorage or Supabase table)
- Traffic light color rules for UI
- Timeout/retry logic in `/api/analyze`
- E-number synonym expansion before OpenAI call
- Local `lib/parse.ts` integration for offline ingredient colorization
- Telemetry and cost tracking
