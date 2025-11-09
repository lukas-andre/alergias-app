# Type System

## Overview

AlergiasCL uses a **strongly-typed** architecture where data flows through well-defined TypeScript interfaces from OpenAI's raw response to the final UI components. This document explains the type hierarchy, transformations, and how types ensure data consistency across the system.

### Type Flow Summary

```
OpenAI API Response
    ↓
IngredientsResult (structured extraction)
    ↓
RiskAssessment (allergen evaluation)
    ↓
ViewModel (UI-ready representation)
    ↓
React Components (visual rendering)
```

---

## Type Flow Diagram

```mermaid
flowchart TD
    A[User uploads image] --> B[OpenAI Vision API]

    B --> C[IngredientsResult<br/>lib/openai/vision-types.ts]

    C --> D[Supabase RPC:<br/>get_profile_payload]
    D --> E[ProfilePayload<br/>lib/risk/types.ts]

    C --> F[Supabase RPC:<br/>decide_e_number]
    F --> G[ENumberPolicy[]<br/>lib/supabase/queries/enumbers.ts]

    C --> H{evaluateRisk<br/>lib/risk/evaluate.ts}
    E --> H
    G --> H

    H --> I[RiskAssessment<br/>lib/risk/types.ts]

    C --> J{buildResultViewModel<br/>lib/risk/view-model.ts}
    I --> J
    E --> J

    J --> K[ViewModel<br/>lib/risk/view-model.ts]

    K --> L[ResultViewModelRenderer<br/>components/scan/]

    L --> M[VerdictPill]
    L --> N[WhyList]
    L --> O[IngredientPanel]
    L --> P[ENumberTable]

    style C fill:#3b82f6
    style I fill:#8b5cf6
    style K fill:#10b981
```

---

## Core Type Definitions

### 1. IngredientsResult (OpenAI Output)

**Location:** `lib/openai/vision-types.ts`

```typescript
export interface IngredientsResult {
  /**
   * OCR text extracted from the label (full text, not just ingredients)
   */
  ocr_text: string;

  /**
   * Structured mentions with type, location, and allergen implications
   */
  mentions: Mention[];

  /**
   * Detected allergens aggregated from mentions
   */
  detected_allergens: DetectedAllergen[];

  /**
   * Quality assessment of the extraction
   */
  quality: {
    legibility: "low" | "medium" | "high";
    confidence: number; // 0-1
  };

  /**
   * ISO 639-1 language code (e.g., "es")
   */
  source_language: string;

  /**
   * Warnings or issues detected during extraction
   */
  warnings: string[];
}
```

#### Mention Structure

```typescript
export interface Mention {
  /**
   * Original text as it appears on label
   * Example: "leche descremada (3%)"
   */
  surface: string;

  /**
   * Normalized canonical form (lowercase, no accents)
   * Example: "leche_descremada"
   */
  canonical: string;

  /**
   * Type of mention
   */
  type: MentionType;

  /**
   * Section where found
   */
  section: Section;

  /**
   * Character span in ocr_text
   */
  offset: {
    start: number; // Inclusive
    end: number;   // Exclusive
  };

  /**
   * E-numbers found in this mention
   * Example: ["E322", "E471"]
   */
  enumbers: string[];

  /**
   * Allergen keys implied by this mention
   * Example: ["leche"] for "leche descremada"
   */
  implies_allergens: string[];

  /**
   * Display snippet for UI (may include context)
   * Example: "leche descremada (3%)"
   */
  evidence: string;
}

export type MentionType =
  | "ingredient"     // Regular ingredient
  | "allergen"       // Explicit allergen mention
  | "claim"          // "Sin gluten", "Vegano", etc.
  | "warning"        // "Puede contener trazas"
  | "icon";          // Allergen badge/pictogram

export type Section =
  | "ingredients"       // Ingredient list
  | "may_contain"       // "Puede contener" section
  | "manufactured_in"   // "Elaborado en instalación que..."
  | "front_label"       // Front-of-pack claims
  | "allergen_warning"  // Explicit allergen warnings
  | "nutritional"       // Nutrition table
  | "other";            // Unclassified
```

#### DetectedAllergen Structure

```typescript
export interface DetectedAllergen {
  /**
   * Allergen key (matches allergen_types.key)
   * Example: "leche", "gluten", "soja"
   */
  key: string;

  /**
   * Mention IDs that detected this allergen (indices into mentions array)
   * Example: [0, 3, 7] means mentions[0], mentions[3], mentions[7]
   */
  source_mentions: number[];

  /**
   * Aggregated confidence (max of source mention confidences)
   */
  confidence: number;
}
```

### Example IngredientsResult

```json
{
  "ocr_text": "INGREDIENTES: Leche descremada (65%), azúcar, crema (leche), almidón modificado, E471, E322 (lecitina de soja). PUEDE CONTENER: Trazas de gluten y frutos secos.",
  "mentions": [
    {
      "surface": "Leche descremada",
      "canonical": "leche_descremada",
      "type": "ingredient",
      "section": "ingredients",
      "offset": { "start": 14, "end": 31 },
      "enumbers": [],
      "implies_allergens": ["leche"],
      "evidence": "Leche descremada (65%)"
    },
    {
      "surface": "crema (leche)",
      "canonical": "crema",
      "type": "ingredient",
      "section": "ingredients",
      "offset": { "start": 47, "end": 60 },
      "enumbers": [],
      "implies_allergens": ["leche"],
      "evidence": "crema (leche)"
    },
    {
      "surface": "E322 (lecitina de soja)",
      "canonical": "e322",
      "type": "ingredient",
      "section": "ingredients",
      "offset": { "start": 96, "end": 119 },
      "enumbers": ["E322"],
      "implies_allergens": ["soja"],
      "evidence": "E322 (lecitina de soja)"
    },
    {
      "surface": "PUEDE CONTENER: Trazas de gluten y frutos secos",
      "canonical": "trazas_gluten_frutos_secos",
      "type": "warning",
      "section": "may_contain",
      "offset": { "start": 121, "end": 169 },
      "enumbers": [],
      "implies_allergens": ["gluten", "frutos_secos"],
      "evidence": "PUEDE CONTENER: Trazas de gluten y frutos secos"
    }
  ],
  "detected_allergens": [
    {
      "key": "leche",
      "source_mentions": [0, 1],
      "confidence": 0.95
    },
    {
      "key": "soja",
      "source_mentions": [2],
      "confidence": 0.88
    },
    {
      "key": "gluten",
      "source_mentions": [3],
      "confidence": 0.92
    },
    {
      "key": "frutos_secos",
      "source_mentions": [3],
      "confidence": 0.92
    }
  ],
  "quality": {
    "legibility": "high",
    "confidence": 0.91
  },
  "source_language": "es",
  "warnings": []
}
```

---

### 2. ProfilePayload (User Configuration)

**Location:** `lib/risk/types.ts`

```typescript
export interface ProfilePayload {
  user_id: string;

  /**
   * Basic profile info
   */
  profile: {
    display_name: string | null;
    notes: string | null;
    pregnant: boolean;
    created_at: string;
    updated_at: string;
  } | null;

  /**
   * Diet restrictions (keys from diet_types table)
   * Example: ["vegan", "celiac"]
   */
  diets: string[];

  /**
   * User allergens with severity
   */
  allergens: Array<{
    key: string;          // Allergen key (e.g., "leche")
    severity: number;     // 0-3 (0=mild, 1=moderate, 2=severe, 3=anaphylaxis)
  }>;

  /**
   * Intolerances (non-allergic reactions)
   */
  intolerances: Array<{
    key: string;          // Intolerance key (e.g., "lactosa", "fodmap")
    severity: number;     // 0-3
  }>;

  /**
   * Active strictness profile settings
   */
  strictness: {
    id: string;
    name: string;                              // "Diario", "Pediátrico", "Anaphylaxis"
    block_traces: boolean;                     // Block "Puede contener" warnings
    block_same_line: boolean;                  // Block "Misma línea" warnings
    e_numbers_uncertain: "allow" | "warn" | "block"; // How to handle uncertain E-numbers
    min_model_confidence: number;              // Threshold for low confidence warning (0-1)
    pediatric_mode: boolean;                   // Extra caution for children
    anaphylaxis_mode: boolean;                 // Maximum strictness
    residual_protein_ppm_default: number;      // PPM threshold for residual proteins
  } | null;

  /**
   * Per-allergen overrides
   */
  overrides: Record<
    string, // Allergen key
    {
      block_traces?: boolean;
      block_same_line?: boolean;
      e_numbers_uncertain?: "allow" | "warn" | "block";
      residual_protein_ppm?: number;
      notes?: string;
    }
  >;
}
```

#### Example ProfilePayload

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "profile": {
    "display_name": "María González",
    "notes": "Alergia severa a leche y frutos secos",
    "pregnant": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-03-20T15:45:00Z"
  },
  "diets": ["vegetarian"],
  "allergens": [
    { "key": "leche", "severity": 3 },
    { "key": "frutos_secos", "severity": 2 }
  ],
  "intolerances": [
    { "key": "lactosa", "severity": 1 }
  ],
  "strictness": {
    "id": "uuid-strictness-profile",
    "name": "Anaphylaxis",
    "block_traces": true,
    "block_same_line": true,
    "e_numbers_uncertain": "block",
    "min_model_confidence": 0.85,
    "pediatric_mode": false,
    "anaphylaxis_mode": true,
    "residual_protein_ppm_default": 5
  },
  "overrides": {
    "leche": {
      "block_traces": true,
      "residual_protein_ppm": 2,
      "notes": "Extreme sensitivity, history of anaphylaxis"
    }
  }
}
```

---

### 3. ENumberPolicy (E-number Evaluation)

**Location:** `lib/supabase/queries/enumbers.ts`

```typescript
export interface ENumberPolicy {
  /**
   * E-number code
   * Example: "E322"
   */
  code: string;

  /**
   * Policy decision for this user
   */
  policy: "allow" | "warn" | "block" | "unknown";

  /**
   * Spanish name of additive
   * Example: "Lecitina"
   */
  name_es?: string;

  /**
   * Allergens this E-number may be derived from
   * Example: ["soja", "huevo"] for E322
   */
  linked_allergens?: string[];

  /**
   * Allergens from linked_allergens that user is allergic to
   * Example: ["soja"] if user has soja allergy
   */
  matched_allergens?: string[];

  /**
   * Whether this E-number poses residual protein risk
   */
  residual_protein_risk?: boolean;

  /**
   * Human-readable explanation of policy
   * Example: "Contains soy, user is allergic"
   */
  reason?: string;

  /**
   * Known sources of this additive
   * Example: ["soja", "girasol", "huevo"]
   */
  likely_origins?: string[];

  /**
   * Whether this E-number exists in database
   */
  exists?: boolean;
}
```

#### Example ENumberPolicy

```json
{
  "code": "E322",
  "policy": "block",
  "name_es": "Lecitina",
  "linked_allergens": ["soja", "huevo"],
  "matched_allergens": ["soja"],
  "residual_protein_risk": true,
  "reason": "Lecithin may be derived from soy, which you are allergic to. Residual protein risk present.",
  "likely_origins": ["soja", "girasol", "huevo"],
  "exists": true
}
```

---

### 4. RiskAssessment (Risk Evaluation Result)

**Location:** `lib/risk/types.ts`

```typescript
export interface RiskAssessment {
  /**
   * Overall risk level
   */
  level: RiskLevel;

  /**
   * Risk decision
   */
  decision: RiskDecision;

  /**
   * Overall confidence in assessment (0-1)
   */
  confidence: number;

  /**
   * Detailed reasons for risk decision
   */
  reasons: RiskReason[];

  /**
   * Matched items from profile
   */
  matched: {
    allergens: MatchedAllergen[];
    diets: MatchedDiet[];
    intolerances: MatchedIntolerance[];
    enumbers: MatchedENumber[];
  };

  /**
   * Suggested actions for user
   */
  actions: Array<"guardar" | "ver alternativas" | "ver mapa cercano" | "pedir verificación">;
}

export type RiskLevel = "low" | "medium" | "high";
export type RiskDecision = "allow" | "warn" | "block";

export type RiskReasonKind =
  | "allergen"          // Allergen match from profile
  | "diet"              // Diet restriction (celiac, vegan, etc)
  | "intolerance"       // Intolerance trigger (FODMAP, lactose)
  | "enumber"           // E-number policy
  | "residual_protein"  // Residual protein concern
  | "low_confidence";   // Model confidence below threshold

export type AllergenVia =
  | "explicit"          // Direct ingredient match
  | "may_contain"       // "Puede contener" / trace warning
  | "icon"              // Front-of-pack badge/icon
  | "derived";          // Derived/implied (e.g., E-number origin)

export interface RiskReason {
  kind: RiskReasonKind;
  via?: AllergenVia;           // For allergen reasons
  mentionIds: number[];         // References to Mention indices
  allergenKey?: string;         // Which allergen triggered
  rule: string;                 // Which rule triggered (e.g., "allergen.inline.block")
  confidence: number;           // Confidence of this reason (0-1)
  evidence: string;             // Human-readable evidence
  // E-number specific
  eNumberCode?: string;
  linkedAllergens?: string[];
  // Diet/intolerance specific
  dietKey?: string;
  intoleranceKey?: string;
}

export interface MatchedAllergen {
  key: string;
  decision: RiskDecision;
  confidence: number;
  severity: number;             // From profile
  via: AllergenVia[];           // All ways this was matched
  mentionIds: number[];
}

export interface MatchedDiet {
  key: string;
  decision: RiskDecision;
  blockedIngredients: string[];
  mentionIds: number[];
}

export interface MatchedIntolerance {
  key: string;
  decision: RiskDecision;
  triggeredBy: string[];
  mentionIds: number[];
}

export interface MatchedENumber {
  code: string;
  decision: RiskDecision;
  policy: "allow" | "warn" | "block" | "unknown";
  nameEs?: string;
  linkedAllergens?: string[];
  reason?: string;
  mentionIds: number[];
}
```

#### Example RiskAssessment

```json
{
  "level": "high",
  "decision": "block",
  "confidence": 0.91,
  "reasons": [
    {
      "kind": "allergen",
      "via": "explicit",
      "mentionIds": [0, 1],
      "allergenKey": "leche",
      "rule": "allergen.inline.block",
      "confidence": 0.95,
      "evidence": "Contiene leche descremada (65%) y crema (leche)"
    },
    {
      "kind": "allergen",
      "via": "may_contain",
      "mentionIds": [3],
      "allergenKey": "gluten",
      "rule": "allergen.trace.block",
      "confidence": 0.92,
      "evidence": "PUEDE CONTENER: Trazas de gluten"
    },
    {
      "kind": "enumber",
      "mentionIds": [2],
      "eNumberCode": "E322",
      "linkedAllergens": ["soja"],
      "rule": "enumber.block",
      "confidence": 0.88,
      "evidence": "E322 (lecitina) puede derivarse de soja"
    }
  ],
  "matched": {
    "allergens": [
      {
        "key": "leche",
        "decision": "block",
        "confidence": 0.95,
        "severity": 3,
        "via": ["explicit"],
        "mentionIds": [0, 1]
      },
      {
        "key": "gluten",
        "decision": "warn",
        "confidence": 0.92,
        "severity": 0,
        "via": ["may_contain"],
        "mentionIds": [3]
      }
    ],
    "diets": [],
    "intolerances": [],
    "enumbers": [
      {
        "code": "E322",
        "decision": "block",
        "policy": "block",
        "nameEs": "Lecitina",
        "linkedAllergens": ["soja"],
        "reason": "May contain soy traces",
        "mentionIds": [2]
      }
    ]
  },
  "actions": ["ver alternativas", "pedir verificación"]
}
```

---

### 5. ViewModel (UI Representation)

**Location:** `lib/risk/view-model.ts`

```typescript
export interface ResultViewModel {
  /**
   * Top-level verdict display
   */
  verdict: {
    level: RiskLevel;               // "low" | "medium" | "high"
    emoji: string;                  // "✅" | "⚠️" | "🚫"
    title: string;                  // "Producto Seguro" | "Precaución" | "No Consumir"
    description: string;            // Short explanation
    confidence: number;             // Overall confidence (0-1)
  };

  /**
   * Sections for result display
   */
  sections: Section[];

  /**
   * "Why" list items (evidence-based reasons)
   */
  whyItems: WhyItem[];

  /**
   * Suggested actions
   */
  actions: Action[];

  /**
   * Original data for debugging
   */
  meta: {
    scannedAt: string;              // ISO timestamp
    model: string;                  // "gpt-4o-mini"
    costUSD?: number;               // API cost
    cacheHit?: boolean;             // From cache?
  };
}

export interface Section {
  title: string;
  items: SectionItem[];
  style: "default" | "danger" | "warning" | "success";
}

export interface SectionItem {
  label: string;
  value: string;
  severity?: "low" | "medium" | "high";
  icon?: string;
}

export interface WhyItem {
  icon: string;                     // Emoji or icon name
  text: string;                     // Evidence text
  severity: "low" | "medium" | "high";
}

export interface Action {
  label: string;
  variant: "default" | "outline" | "destructive";
  icon?: string;
  href?: string;
}
```

#### Example ViewModel

```json
{
  "verdict": {
    "level": "high",
    "emoji": "🚫",
    "title": "No Consumir",
    "description": "Este producto contiene leche y soja, a los cuales eres alérgico.",
    "confidence": 0.91
  },
  "sections": [
    {
      "title": "Alérgenos Detectados",
      "style": "danger",
      "items": [
        {
          "label": "Leche",
          "value": "Presente (directamente)",
          "severity": "high",
          "icon": "🥛"
        },
        {
          "label": "Soja",
          "value": "E322 (lecitina de soja)",
          "severity": "high",
          "icon": "🌱"
        }
      ]
    },
    {
      "title": "Advertencias",
      "style": "warning",
      "items": [
        {
          "label": "Trazas",
          "value": "Puede contener gluten y frutos secos",
          "severity": "medium"
        }
      ]
    }
  ],
  "whyItems": [
    {
      "icon": "🥛",
      "text": "Contiene leche descremada y crema (leche)",
      "severity": "high"
    },
    {
      "icon": "🌱",
      "text": "E322 (lecitina) puede derivarse de soja",
      "severity": "high"
    },
    {
      "icon": "⚠️",
      "text": "Puede contener trazas de gluten y frutos secos",
      "severity": "medium"
    }
  ],
  "actions": [
    {
      "label": "Ver Alternativas",
      "variant": "default",
      "icon": "🔍"
    },
    {
      "label": "Pedir Verificación",
      "variant": "outline",
      "icon": "📸"
    }
  ],
  "meta": {
    "scannedAt": "2024-03-20T15:30:00Z",
    "model": "gpt-4o-mini",
    "costUSD": 0.0021,
    "cacheHit": false
  }
}
```

---

## Type Generation

### From Supabase Schema

Database types are auto-generated from Supabase schema:

```bash
# Regenerate types when schema changes
npx supabase gen types typescript \
  --project-id <your-project-ref> \
  --schema public \
  > lib/supabase/types.ts
```

**Generated types include:**
- All table row types (`Tables["table_name"]["Row"]`)
- All table insert types (`Tables["table_name"]["Insert"]`)
- All RPC function signatures

### Custom Type Guards

**Location:** `lib/risk/evaluate.ts`

```typescript
/**
 * Type guard for valid RiskLevel
 */
function isRiskLevel(value: string): value is RiskLevel {
  return ["low", "medium", "high"].includes(value);
}

/**
 * Type guard for Mention with allergen implications
 */
function hasAllergenImplications(mention: Mention): boolean {
  return mention.implies_allergens.length > 0;
}
```

---

## Type Transformations

### 1. IngredientsResult → RiskAssessment

**Function:** `evaluateRisk()` in `lib/risk/evaluate.ts:100`

```typescript
export function evaluateRisk(
  analysis: IngredientsResult,
  profile: ProfilePayload | null,
  eNumberPolicies: ENumberPolicy[]
): RiskAssessment {
  // Step 1: Match allergens from mentions
  const matchedAllergens = matchAllergensFromMentions(
    analysis.mentions,
    analysis.detected_allergens,
    profile?.allergens || []
  );

  // Step 2: Evaluate E-numbers
  const matchedENumbers = evaluateENumbers(
    analysis.mentions,
    eNumberPolicies
  );

  // Step 3: Check diets
  const matchedDiets = checkDietRestrictions(
    analysis.mentions,
    profile?.diets || []
  );

  // Step 4: Apply strictness overrides
  const effectiveStrictness = applyStrictnessOverrides(
    profile?.strictness,
    profile?.overrides
  );

  // Step 5: Determine overall risk level
  const level = determineRiskLevel(
    matchedAllergens,
    matchedENumbers,
    matchedDiets,
    effectiveStrictness
  );

  // Step 6: Collect evidence
  const reasons = collectRiskReasons(
    matchedAllergens,
    matchedENumbers,
    matchedDiets,
    analysis.quality.confidence
  );

  return {
    level,
    decision: levelToDecision(level),
    confidence: analysis.quality.confidence,
    reasons,
    matched: {
      allergens: matchedAllergens,
      diets: matchedDiets,
      intolerances: [],
      enumbers: matchedENumbers
    },
    actions: determineActions(level)
  };
}
```

### 2. RiskAssessment → ViewModel

**Function:** `buildResultViewModel()` in `lib/risk/view-model.ts:50`

```typescript
export function buildResultViewModel({
  analysis,
  risk,
  profile,
  imageBase64,
  model,
  costUSD,
  scannedAt
}: {
  analysis: IngredientsResult;
  risk: RiskAssessment;
  profile: ProfilePayload | null;
  imageBase64?: string;
  model: string;
  costUSD?: number;
  scannedAt?: string;
}): ResultViewModel {
  // Build verdict
  const verdict = {
    level: risk.level,
    emoji: levelToEmoji(risk.level),
    title: levelToTitle(risk.level),
    description: buildVerdictDescription(risk, profile),
    confidence: risk.confidence
  };

  // Build sections (allergens, E-numbers, ingredients)
  const sections = buildSections(risk, analysis);

  // Build "why" items from reasons
  const whyItems = risk.reasons.map(reason => ({
    icon: reasonKindToIcon(reason.kind),
    text: reason.evidence,
    severity: determineSeverity(reason, risk.level)
  }));

  // Determine actions
  const actions = buildActions(risk.level, risk.decision);

  return {
    verdict,
    sections,
    whyItems,
    actions,
    meta: {
      scannedAt: scannedAt || new Date().toISOString(),
      model,
      costUSD,
      cacheHit: false
    }
  };
}
```

---

## Type Safety Best Practices

### 1. Always Use Type Assertions After Validation

```typescript
// ❌ Bad: Unsafe cast
const analysis = data as IngredientsResult;

// ✅ Good: Validate then cast
if (!Array.isArray(rawJson.mentions)) {
  throw new Error("Invalid format: missing mentions array");
}
const analysis = rawJson as unknown as IngredientsResult;
```

### 2. Use Type Guards for Runtime Checks

```typescript
// Type guard
function isValidMention(obj: unknown): obj is Mention {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "surface" in obj &&
    "canonical" in obj &&
    "type" in obj
  );
}

// Usage
if (isValidMention(mention)) {
  // TypeScript knows mention is Mention here
  console.log(mention.surface);
}
```

### 3. Avoid `any` - Use `unknown` Instead

```typescript
// ❌ Bad
const data: any = await response.json();

// ✅ Good
const data: unknown = await response.json();
if (isIngredientsResult(data)) {
  // Now TypeScript knows data is IngredientsResult
  processResult(data);
}
```

---

## Common Type Pitfalls

### 1. Supabase RPC Returns `Json` Type

```typescript
// RPC returns Json type, needs casting
const { data, error } = await supabase.rpc("get_profile_payload", {
  p_user_id: userId
});

if (data && typeof data === "object") {
  // Cast to ProfilePayload after validation
  const profile = data as unknown as ProfilePayload;
}
```

### 2. Mention Offsets Are Exclusive End

```typescript
// ❌ Wrong: Treats end as inclusive
const text = ocr_text.substring(offset.start, offset.end + 1);

// ✅ Correct: End is exclusive
const text = ocr_text.substring(offset.start, offset.end);
```

### 3. DetectedAllergen.source_mentions Are Indices

```typescript
// ❌ Wrong: Treating as allergen keys
const allergenKeys = detected_allergens.flatMap(a => a.source_mentions);

// ✅ Correct: Use as indices into mentions array
const allergenMentions = detected_allergens.flatMap(a =>
  a.source_mentions.map(idx => mentions[idx])
);
```

---

## Type Evolution Strategy

### Adding New Fields

1. **Add to type definition** (`lib/openai/vision-types.ts`)
2. **Update OpenAI schema** (`lib/openai/vision.ts:44`)
3. **Handle in evaluateRisk** (`lib/risk/evaluate.ts`)
4. **Transform in buildResultViewModel** (`lib/risk/view-model.ts`)
5. **Render in components** (`components/scan/`)

### Deprecating Old Fields

1. **Mark as optional** in type (`field?: Type`)
2. **Add migration logic** (handle both old and new formats)
3. **Update OpenAI schema** (remove from required fields)
4. **Remove after verification** (check no old data exists)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system design
- [OPENAI_INTEGRATION.md](./OPENAI_INTEGRATION.md) - IngredientsResult generation
- [RISK_ENGINE.md](./RISK_ENGINE.md) - RiskAssessment evaluation
- [API_CONTRACTS.md](./API_CONTRACTS.md) - API request/response types

---

## Code References

- Type definitions: `lib/openai/vision-types.ts`, `lib/risk/types.ts`
- Type transformations: `lib/risk/evaluate.ts`, `lib/risk/view-model.ts`
- Supabase types: `lib/supabase/types.ts` (auto-generated)
- Component types: `components/scan/*.tsx`
