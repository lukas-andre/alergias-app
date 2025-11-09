# API Contracts

## Overview

AlergiasCL exposes 3 main API endpoints for label scanning and profile management. All endpoints are Next.js API routes with built-in authentication via Supabase Auth.

**Base URL:** `http://localhost:3000` (dev) / `https://alergias.cl` (prod)

**Authentication:** Optional for `/api/analyze`, required for `/api/profile` and `/api/result/[id]`

---

## POST /api/analyze

Analyzes a product label image using OpenAI Vision API and evaluates allergen risk.

### Request

**Content-Type:** `multipart/form-data`

```typescript
interface AnalyzeRequest {
  image: File;      // JPEG, PNG, or WebP (< 20MB)
  width?: number;   // Image width (for cost estimation)
  height?: number;  // Image height (for cost estimation)
}
```

**curl Example:**

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Cookie: sb-access-token=..." \
  -F "image=@/path/to/label.jpg" \
  -F "width=1200" \
  -F "height=800"
```

### Response (200 OK)

```typescript
interface AnalyzeResponse {
  // Raw OpenAI extraction
  data: IngredientsResult;

  // UI-ready representation (if authenticated)
  viewModel: ResultViewModel | null;

  // User profile (if authenticated)
  profile: ProfilePayload | null;

  // OpenAI API cost
  tokensUSD: number;  // Actual cost (e.g., 0.0021)

  // Token usage stats
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;

  // Pre-flight cost estimate
  estimatedCost: {
    costUSD: number;
    perImageUSD: number;
    totalImageTokens: number;
    inputTokens: number;
    outputTokens: number;
  } | null;

  // Model used
  model: string;  // "gpt-4o-mini"

  // Extraction ID (if authenticated & stored)
  extraction_id: string | null;

  // Cache status
  from_cache: boolean;
}
```

**Example Response (Authenticated User):**

```json
{
  "data": {
    "ocr_text": "INGREDIENTES: Leche descremada, azúcar, E322 (lecitina de soja). PUEDE CONTENER: Trazas de frutos secos.",
    "mentions": [
      {
        "surface": "Leche descremada",
        "canonical": "leche_descremada",
        "type": "ingredient",
        "section": "ingredients",
        "offset": { "start": 14, "end": 31 },
        "enumbers": [],
        "implies_allergens": ["leche"],
        "evidence": "Leche descremada"
      },
      {
        "surface": "E322 (lecitina de soja)",
        "canonical": "e322",
        "type": "ingredient",
        "section": "ingredients",
        "offset": { "start": 42, "end": 65 },
        "enumbers": ["E322"],
        "implies_allergens": ["soja"],
        "evidence": "E322 (lecitina de soja)"
      }
    ],
    "detected_allergens": [
      { "key": "leche", "source_mentions": [0], "confidence": 0.95 },
      { "key": "soja", "source_mentions": [1], "confidence": 0.90 }
    ],
    "quality": {
      "legibility": "high",
      "confidence": 0.92
    },
    "source_language": "es",
    "warnings": []
  },
  "viewModel": {
    "verdict": {
      "level": "high",
      "emoji": "🚫",
      "title": "No Consumir",
      "description": "Este producto contiene leche y soja, a los cuales eres alérgico.",
      "confidence": 0.92
    },
    "sections": [...],
    "whyItems": [...],
    "actions": ["ver alternativas", "pedir verificación"],
    "meta": {
      "scannedAt": "2024-03-20T15:30:00Z",
      "model": "gpt-4o-mini",
      "costUSD": 0.0021,
      "cacheHit": false
    }
  },
  "profile": {
    "user_id": "user-uuid",
    "allergens": [
      { "key": "leche", "severity": 3 },
      { "key": "soja", "severity": 2 }
    ],
    "strictness": {
      "name": "Anaphylaxis",
      "block_traces": true,
      ...
    },
    ...
  },
  "tokensUSD": 0.0021,
  "usage": {
    "prompt_tokens": 1247,
    "completion_tokens": 423,
    "total_tokens": 1670
  },
  "estimatedCost": {
    "costUSD": 0.0019,
    "perImageUSD": 0.0015,
    "totalImageTokens": 910,
    "inputTokens": 1120,
    "outputTokens": 400
  },
  "model": "gpt-4o-mini",
  "extraction_id": "extraction-uuid",
  "from_cache": false
}
```

**Example Response (Unauthenticated User):**

```json
{
  "data": { /* IngredientsResult */ },
  "viewModel": null,  // No risk assessment without profile
  "profile": null,
  "tokensUSD": 0.0021,
  "usage": { ... },
  "estimatedCost": { ... },
  "model": "gpt-4o-mini",
  "extraction_id": null,  // Not stored
  "from_cache": false
}
```

**Example Response (Cache Hit):**

```json
{
  "data": { /* Cached IngredientsResult */ },
  "viewModel": { /* Re-evaluated with current profile */ },
  "profile": { /* Current profile */ },
  "tokensUSD": 0,  // No OpenAI cost
  "usage": null,
  "estimatedCost": null,
  "model": "gpt-4o-mini",
  "extraction_id": "cached-extraction-uuid",
  "from_cache": true  // ← Cache hit!
}
```

### Error Responses

#### 400 Bad Request

**Missing image:**

```json
{
  "error": "No se recibió ninguna imagen."
}
```

**Invalid image format:**

```json
{
  "error": "Formato de imagen no soportado. Usa JPEG, PNG o WebP."
}
```

**Image too large:**

```json
{
  "error": "Imagen demasiado grande (máx 20MB)."
}
```

#### 500 Internal Server Error

**OpenAI API error:**

```json
{
  "error": "Error inesperado al procesar la imagen.",
  "details": "OpenAI rate limit exceeded"
}
```

**Supabase error (authenticated users):**

```json
{
  "error": "Error guardando el resultado. Intenta nuevamente."
}
```

---

## GET /api/result/[id]

Fetches a previously saved extraction and regenerates the result ViewModel with the user's current profile.

### Request

**Method:** GET

**Path Parameter:** `id` (extraction UUID)

**Authentication:** Required (Supabase session)

**curl Example:**

```bash
curl -X GET http://localhost:3000/api/result/extraction-uuid \
  -H "Cookie: sb-access-token=..."
```

### Response (200 OK)

```typescript
interface ResultResponse {
  viewModel: ResultViewModel;
  profile: ProfilePayload | null;
  extraction_id: string;
  meta: {
    created_at: string;
    model: string;
    costUSD?: number;
    confidence: number | null;
  };
}
```

**Example Response:**

```json
{
  "viewModel": {
    "verdict": {
      "level": "high",
      "emoji": "🚫",
      "title": "No Consumir",
      "description": "Este producto contiene leche, a la cual eres alérgico.",
      "confidence": 0.95
    },
    "sections": [...],
    "whyItems": [...],
    "actions": ["ver alternativas", "pedir verificación"],
    "meta": {
      "scannedAt": "2024-03-15T10:00:00Z",
      "model": "gpt-4o-mini",
      "costUSD": 0.0021
    }
  },
  "profile": {
    "user_id": "user-uuid",
    "allergens": [{ "key": "leche", "severity": 3 }],
    ...
  },
  "extraction_id": "extraction-uuid",
  "meta": {
    "created_at": "2024-03-15T10:00:00Z",
    "model": "gpt-4o-mini",
    "costUSD": 0.0021,
    "confidence": 0.95
  }
}
```

### Error Responses

#### 401 Unauthorized

**Not authenticated:**

```json
{
  "error": "No autenticado."
}
```

#### 404 Not Found

**Extraction not found:**

```json
{
  "error": "Análisis no encontrado."
}
```

#### 410 Gone

**Legacy V1 extraction (no longer supported):**

```json
{
  "error": "Este escaneo usa formato legacy. Por favor re-escanea la etiqueta.",
  "legacy": true
}
```

#### 500 Internal Server Error

**Database error:**

```json
{
  "error": "Error inesperado al regenerar análisis."
}
```

---

## GET /api/profile

Fetches the authenticated user's complete profile (allergens, diets, intolerances, strictness).

### Request

**Method:** GET

**Authentication:** Required (Supabase session)

**curl Example:**

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Cookie: sb-access-token=..."
```

### Response (200 OK)

```typescript
type ProfileResponse = ProfilePayload;
```

**Example Response:**

```json
{
  "user_id": "user-uuid",
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
    "id": "strictness-uuid",
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
      "notes": "Extreme sensitivity, carry EpiPen"
    }
  }
}
```

### Error Responses

#### 401 Unauthorized

**Not authenticated:**

```json
{
  "error": "No autenticado."
}
```

#### 404 Not Found

**Profile not found:**

```json
{
  "error": "Perfil no encontrado. Completa el onboarding primero."
}
```

#### 500 Internal Server Error

**Database error:**

```json
{
  "error": "Error al cargar el perfil."
}
```

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| **200 OK** | Success | Request completed successfully |
| **400 Bad Request** | Invalid input | Missing/invalid parameters |
| **401 Unauthorized** | Not authenticated | Missing or invalid session |
| **404 Not Found** | Resource not found | Extraction/profile doesn't exist |
| **410 Gone** | Resource deprecated | Legacy V1 extraction format |
| **500 Internal Server Error** | Server error | OpenAI/Supabase/unexpected errors |

---

## Authentication

### Session-Based Auth (Cookies)

All authenticated requests use Supabase Auth with httpOnly cookies:

```typescript
// Frontend: Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123"
});

// Session is automatically stored in httpOnly cookie
// Subsequent API requests include session cookie
```

**Cookie Name:** `sb-access-token` (set by Supabase)

### Checking Auth Status

```typescript
// In API route
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: "No autenticado." },
    { status: 401 }
  );
}

// User is authenticated, proceed
```

---

## Rate Limiting

**Current:** No rate limiting (TODO)

**Future implementation:**

```typescript
// Planned: 100 scans/hour per user
interface RateLimitResponse {
  error: "Rate limit exceeded. Try again in 30 minutes.",
  retryAfter: 1800  // Seconds until reset
}
```

**Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1710943200
```

---

## CORS

**Current:** Same-origin only (Next.js default)

**Future (if needed):**

```typescript
// Allow specific origins
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://app.alergias.cl',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

---

## Versioning

**Current:** No versioning (single format)

**Future strategy:**

```
POST /api/v2/analyze  # New version
POST /api/analyze     # Legacy redirect to v2
```

**Client version negotiation:**

```typescript
const response = await fetch("/api/analyze", {
  headers: {
    "Accept-Version": "2.0"  // Request specific version
  }
});
```

---

## Testing APIs

### Development

```bash
# Start dev server
npm run dev

# Test analyze endpoint
curl -X POST http://localhost:3000/api/analyze \
  -F "image=@test-label.jpg"

# Test profile endpoint (requires auth)
curl -X GET http://localhost:3000/api/profile \
  -H "Cookie: sb-access-token=$(cat .cookies)"
```

### Production

```bash
# Test analyze endpoint
curl -X POST https://alergias.cl/api/analyze \
  -F "image=@test-label.jpg"

# Test with authentication
curl -X POST https://alergias.cl/api/analyze \
  -H "Cookie: sb-access-token=..." \
  -F "image=@test-label.jpg"
```

### Postman Collection

```json
{
  "info": {
    "name": "AlergiasCL API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Analyze Label",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "image",
              "type": "file",
              "src": "/path/to/label.jpg"
            },
            {
              "key": "width",
              "value": "1200",
              "type": "text"
            },
            {
              "key": "height",
              "value": "800",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/analyze",
          "host": ["{{baseUrl}}"],
          "path": ["api", "analyze"]
        }
      }
    }
  ]
}
```

---

## Monitoring & Logging

### Request Logging (Server-side)

```typescript
// Log all API requests
console.log(`[${method}] ${pathname} - ${user?.id || 'anonymous'}`);
```

### Error Tracking

```typescript
// Log errors to Sentry (future)
Sentry.captureException(error, {
  extra: {
    userId: user?.id,
    endpoint: '/api/analyze',
    imageSize: image.size
  }
});
```

### Metrics Dashboard

**Key metrics to track:**

1. **Requests per endpoint:** `/api/analyze`, `/api/profile`, `/api/result/[id]`
2. **Response times:** P50, P95, P99
3. **Error rates:** 4xx, 5xx per endpoint
4. **Cache hit rate:** `from_cache: true` vs `false`
5. **OpenAI costs:** Total spend per day/week/month

---

## Common Integration Patterns

### Frontend Integration (React)

```typescript
// Upload image
async function scanLabel(imageFile: File) {
  const formData = new FormData();
  formData.append("image", imageFile);

  // Optional: Add dimensions for cost estimation
  const { width, height } = await getImageDimensions(imageFile);
  formData.append("width", String(width));
  formData.append("height", String(height));

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result;
}
```

### Webhook Integration (Future)

```typescript
// Notify external system on new scan
POST https://external-system.com/webhooks/alergias
{
  "event": "scan.completed",
  "user_id": "user-uuid",
  "extraction_id": "extraction-uuid",
  "risk_level": "high",
  "timestamp": "2024-03-20T15:30:00Z"
}
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [TYPE_SYSTEM.md](./TYPE_SYSTEM.md) - Request/response type definitions
- [OPENAI_INTEGRATION.md](./OPENAI_INTEGRATION.md) - OpenAI Vision API integration
- [RISK_ENGINE.md](./RISK_ENGINE.md) - Risk assessment logic
- [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) - Cache behavior (`from_cache` flag)

---

## Code References

- **POST /api/analyze:** `app/api/analyze/route.ts`
- **GET /api/result/[id]:** `app/api/result/[id]/route.ts`
- **GET /api/profile:** `app/api/profile/route.ts`
- **Type definitions:** `lib/openai/vision-types.ts`, `lib/risk/types.ts`, `lib/risk/view-model.ts`

---

## Future API Endpoints

### Planned Endpoints

1. **POST /api/barcode** - Scan barcode for product lookup
2. **GET /api/history** - List user's scan history
3. **POST /api/venues** - Scan restaurant menus
4. **GET /api/stats** - User statistics (scans/month, allergens detected)
5. **POST /api/feedback** - Report incorrect scan results
