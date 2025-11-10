# Scanner Improvements: Historial, Performance & Storage

> **Objetivo**: Mejorar UX del scanner con historial completo, reducir latencia con batch RPCs, y migrar imágenes de base64 → Supabase Storage.

**Fecha**: 2025-01-10
**Status**: 🚧 In Progress
**Prioridad**: P0 (Technical Debt + UX Critical)

---

## 📊 Contexto y Análisis

### Estado Actual de la Base de Datos

```sql
-- Resultados de análisis (2025-01-10)
SELECT
  COUNT(*) as total_extractions,              -- 14
  SUM(CASE WHEN image_base64 IS NOT NULL THEN 1 ELSE 0 END) as with_images,  -- 13
  AVG(LENGTH(image_base64)) as avg_base64_length  -- ~122KB
FROM extractions;
```

**Problemas Identificados:**

1. ❌ **NO existe página de historial** - Solo sidebar con últimos 3 scans
2. ❌ **N+1 Problem en E-numbers** - Loop de RPCs individuales causa latencia
3. ❌ **Imágenes en DB como TEXT** - ~122KB promedio × 13 = 1.5MB desperdiciados en Postgres
4. ✅ **Textarea input** - Descartado por usuario (no recordaba propósito)

---

## 🎯 Tareas a Implementar

### Resumen Ejecutivo

| # | Tarea | Complejidad | Impacto | Orden |
|---|-------|-------------|---------|-------|
| 1 | **Historial completo con paginación** | 🟢 Baja | 🟡 UX | Primero |
| 2 | **RPC batch para E-numbers** | 🟡 Media | 🟢 Performance | Segundo |
| 3 | **Migrar imágenes a Storage** | 🔴 Alta | 🟢 Costo + Scale | Tercero |

---

## 1️⃣ TAREA 1: Historial Completo con Paginación

### Objetivo

Crear una página `/history` que muestre todos los escaneos del usuario con:
- Paginación server-side (20 items/página)
- Grid responsivo de cards
- Thumbnails (post-migración de Storage)
- Filtros por fecha, verdict, allergen count
- Metadata: timestamp, confidence, allergen count

### Archivos a Crear

```
app/
  history/
    page.tsx                      # Página principal

components/
  history/
    HistoryList.tsx               # Lista con paginación
    HistoryFilters.tsx            # Filtros opcionales
    HistoryCard.tsx               # Card individual
```

### Implementación Detallada

#### 1.1 Extender Query de Extracciones

**Archivo:** `lib/supabase/queries/extractions.ts`

```typescript
/**
 * Fetch paginated extractions for history page
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param options - Pagination and filter options
 * @returns Paginated extractions with metadata
 */
export async function getPaginatedExtractions(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: {
    page?: number;        // Page number (0-indexed)
    pageSize?: number;    // Items per page (default: 20)
    orderBy?: 'created_at' | 'final_confidence';
    orderDirection?: 'asc' | 'desc';
  } = {}
): Promise<{
  data: Array<{
    id: string;
    created_at: string;
    final_confidence: number | null;
    detected_allergens: string[];
    allergen_count: number;
    image_url?: string;  // Will use source_ref after Storage migration
    verdict_level: 'low' | 'medium' | 'high' | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const {
    page = 0,
    pageSize = 20,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;

  // Get total count
  const { count, error: countError } = await supabase
    .from('extractions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('origin', 'label');

  if (countError) {
    console.error('Error getting extraction count:', countError);
    throw new Error(`Failed to get count: ${countError.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Get paginated data
  const { data, error } = await supabase
    .from('extractions')
    .select('id, created_at, final_confidence, raw_json, source_ref, image_base64')
    .eq('user_id', userId)
    .eq('origin', 'label')
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) {
    console.error('Error fetching extractions:', error);
    throw new Error(`Failed to fetch extractions: ${error.message}`);
  }

  // Transform data
  const transformedData = (data || []).map((item) => {
    const rawJson = item.raw_json as IngredientsResult | null;
    const detectedAllergens = rawJson?.detected_allergens.map(a => a.key) || [];
    const confidence = item.final_confidence || rawJson?.quality.confidence || null;

    // Compute verdict level from confidence (simplified)
    let verdictLevel: 'low' | 'medium' | 'high' | null = null;
    if (confidence !== null) {
      if (confidence >= 0.9) verdictLevel = 'low';
      else if (confidence >= 0.7) verdictLevel = 'medium';
      else verdictLevel = 'high';
    }

    // Image URL: prioritize source_ref (Storage), fallback to base64
    let imageUrl: string | undefined;
    if (item.source_ref) {
      // TODO: Generate signed URL from Storage
      imageUrl = item.source_ref;
    } else if (item.image_base64) {
      imageUrl = `data:image/jpeg;base64,${item.image_base64}`;
    }

    return {
      id: item.id,
      created_at: item.created_at,
      final_confidence: confidence,
      detected_allergens: detectedAllergens,
      allergen_count: detectedAllergens.length,
      image_url: imageUrl,
      verdict_level: verdictLevel,
    };
  });

  return {
    data: transformedData,
    total,
    page,
    pageSize,
    totalPages,
  };
}
```

#### 1.2 Componente HistoryCard

**Archivo:** `components/history/HistoryCard.tsx`

```tsx
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { humanizeTimestamp } from "@/lib/utils/humanize-copy";

interface HistoryCardProps {
  id: string;
  created_at: string;
  verdict_level: 'low' | 'medium' | 'high' | null;
  allergen_count: number;
  image_url?: string;
}

export function HistoryCard({
  id,
  created_at,
  verdict_level,
  allergen_count,
  image_url,
}: HistoryCardProps) {
  const verdictConfig = {
    low: {
      icon: CheckCircle,
      label: "Seguro",
      color: "bg-accent-fresh-100 text-accent-fresh-dark border-accent-fresh",
    },
    medium: {
      icon: AlertCircle,
      label: "Precaución",
      color: "bg-warning-100 text-warning-dark border-warning",
    },
    high: {
      icon: AlertTriangle,
      label: "Alto Riesgo",
      color: "bg-danger-100 text-danger-dark border-danger",
    },
  };

  const config = verdict_level ? verdictConfig[verdict_level] : null;
  const Icon = config?.icon || Clock;

  return (
    <Link href={`/scan/result/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-300">
        <CardContent className="p-4 space-y-3">
          {/* Thumbnail */}
          <div className="relative w-full h-32 rounded-lg border-2 border-neutral-200 bg-neutral-50 overflow-hidden">
            {image_url ? (
              <img
                src={image_url}
                alt="Scan thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Clock className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {humanizeTimestamp(created_at)}
            </p>

            <div className="flex items-center gap-2">
              {config && (
                <Badge
                  variant="outline"
                  className={`px-2 py-1 text-xs font-semibold ${config.color}`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              )}

              {allergen_count > 0 && (
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  {allergen_count} alérgeno{allergen_count !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

#### 1.3 Página de Historial

**Archivo:** `app/history/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/SupabaseProvider";
import { getPaginatedExtractions } from "@/lib/supabase/queries/extractions";
import { HistoryCard } from "@/components/history/HistoryCard";

export default function HistoryPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/history");
          return;
        }

        // Fetch paginated extractions
        const result = await getPaginatedExtractions(supabase, user.id, {
          page,
          pageSize: 20,
        });

        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Error loading history:", err);
        setError("Error al cargar el historial. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supabase, router, page]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/scan">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al escáner
            </Button>
          </Link>
        </header>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-3 flex items-center justify-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Historial de Escaneos
          </h1>
          <p className="text-base md:text-lg text-neutral-600">
            Revisa todos tus escaneos anteriores
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-danger text-lg">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">
              Aún no has escaneado ninguna etiqueta
            </p>
            <Link href="/scan">
              <Button variant="default">Escanear Ahora</Button>
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && data.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.map((item) => (
                <HistoryCard
                  key={item.id}
                  id={item.id}
                  created_at={item.created_at}
                  verdict_level={item.verdict_level}
                  allergen_count={item.allergen_count}
                  image_url={item.image_url}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-neutral-600">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
```

#### 1.4 Actualizar RecentScans con Link

**Archivo:** `components/scan/RecentScans.tsx` (modificar)

Agregar link "Ver Todo" en el footer del card:

```tsx
// ... existing code ...

<CardContent className="space-y-3">
  {scans.map((scan) => (
    // ... existing scan cards ...
  ))}

  {/* NEW: Link to full history */}
  <Link href="/history" className="block">
    <Button variant="ghost" size="sm" className="w-full mt-2">
      Ver Todo el Historial
      <ChevronRight className="w-4 h-4 ml-1" />
    </Button>
  </Link>
</CardContent>
```

---

## 2️⃣ TAREA 2: RPC Batch para E-Numbers

### Objetivo

Reducir latencia al evaluar E-numbers cambiando de **N llamadas RPC individuales** → **1 llamada RPC batch**.

**Problema actual:**
```typescript
// ❌ N+1 Problem
for (const code of ["E100", "E202", "E322", ...]) {
  await supabase.rpc("decide_e_number", { p_code: code });  // 10 RPCs!
}
```

**Solución:**
```typescript
// ✅ Batch
await supabase.rpc("decide_e_numbers_batch", {
  p_codes: ["E100", "E202", "E322", ...]
});  // 1 RPC!
```

### Implementación Detallada

#### 2.1 Nueva Migración SQL

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_decide_e_numbers_batch.sql`

```sql
-- Migration: Batch E-number policy decision RPC
-- Optimization to reduce N+1 problem when evaluating multiple E-numbers
--
-- Performance impact:
-- Before: 10 E-numbers = 10 sequential RPC calls (~500ms)
-- After:  10 E-numbers = 1 batch RPC call (~50ms)

CREATE OR REPLACE FUNCTION decide_e_numbers_batch(
  p_user_id uuid,
  p_codes text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user_allergens text[];
  v_result jsonb;
  v_e_numbers_uncertain text;
BEGIN
  -- Get user's allergen keys (once for all E-numbers)
  SELECT array_agg(a.key)
  INTO v_user_allergens
  FROM user_profile_allergens upa
  JOIN allergen_types a ON a.id = upa.allergen_id
  WHERE upa.user_id = p_user_id;

  -- Get user's e_numbers_uncertain policy (once)
  SELECT COALESCE(sp.e_numbers_uncertain, 'warn')
  INTO v_e_numbers_uncertain
  FROM user_profiles up
  LEFT JOIN strictness_profiles sp ON sp.id = up.active_strictness_id
  WHERE up.user_id = p_user_id;

  -- If user has no allergens, allow all by default
  IF v_user_allergens IS NULL OR array_length(v_user_allergens, 1) = 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'code', code,
        'policy', 'allow',
        'name_es', name_es,
        'linked_allergens', linked_allergen_keys,
        'matched_allergens', ARRAY[]::text[],
        'residual_protein_risk', residual_protein_risk,
        'reason', 'No allergens in user profile'
      )
    )
    INTO v_result
    FROM e_numbers
    WHERE code = ANY(p_codes);

    RETURN COALESCE(v_result, '[]'::jsonb);
  END IF;

  -- Process all E-numbers in batch
  SELECT jsonb_agg(
    CASE
      -- E-number doesn't exist
      WHEN e.code IS NULL THEN
        jsonb_build_object(
          'code', input_code,
          'policy', 'unknown',
          'exists', false
        )

      -- E-number has matched allergens
      WHEN matched_allergens IS NOT NULL AND array_length(matched_allergens, 1) > 0 THEN
        jsonb_build_object(
          'code', e.code,
          'policy', CASE
            WHEN e.residual_protein_risk THEN 'block'
            ELSE 'warn'
          END,
          'name_es', e.name_es,
          'linked_allergens', e.linked_allergen_keys,
          'matched_allergens', matched_allergens,
          'residual_protein_risk', e.residual_protein_risk,
          'likely_origins', e.likely_origins,
          'reason', 'E-number linked to user allergen(s): ' || array_to_string(matched_allergens, ', ')
        )

      -- E-number with no allergen match, apply user's uncertain policy
      ELSE
        jsonb_build_object(
          'code', e.code,
          'policy', v_e_numbers_uncertain,
          'name_es', e.name_es,
          'linked_allergens', e.linked_allergen_keys,
          'matched_allergens', ARRAY[]::text[],
          'residual_protein_risk', e.residual_protein_risk,
          'likely_origins', e.likely_origins,
          'reason', 'No allergen match; applying e_numbers_uncertain policy: ' || v_e_numbers_uncertain
        )
    END
  )
  INTO v_result
  FROM unnest(p_codes) AS input_code
  LEFT JOIN e_numbers e ON e.code = input_code
  LEFT JOIN LATERAL (
    -- Compute matched allergens for this E-number
    SELECT array_agg(elem) AS matched_allergens
    FROM unnest(e.linked_allergen_keys) elem
    WHERE elem = ANY(v_user_allergens)
  ) AS matches ON true;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION decide_e_numbers_batch(uuid, text[]) IS
'Batch evaluate E-number risk for user based on allergen profile and strictness settings. Returns JSONB array of policies.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION decide_e_numbers_batch(uuid, text[]) TO authenticated;
```

#### 2.2 Actualizar fetchENumberPolicies()

**Archivo:** `lib/supabase/queries/enumbers.ts`

```typescript
/**
 * Fetch E-number policies for multiple codes (BATCH VERSION)
 *
 * Calls the `decide_e_numbers_batch` RPC once for all codes.
 * Significantly faster than individual calls (~10x speedup for 10 E-numbers).
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID for profile-based policy decisions
 * @param codes - Array of E-number codes (e.g., ["E100", "E202"])
 * @returns Array of E-number policies
 */
export async function fetchENumberPolicies(
  supabase: SupabaseClient<Database>,
  userId: string,
  codes: string[]
): Promise<ENumberPolicy[]> {
  if (codes.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc("decide_e_numbers_batch", {
      p_user_id: userId,
      p_codes: codes,
    });

    if (error) {
      console.error('Error fetching E-number policies (batch):', error);
      return [];
    }

    // data is JSONB array, parse it
    if (Array.isArray(data)) {
      return data as ENumberPolicy[];
    }

    console.warn('Unexpected batch response format:', data);
    return [];
  } catch (error) {
    console.error('Exception fetching E-number policies (batch):', error);
    return [];
  }
}
```

#### 2.3 Validación

**Test manual:**

```typescript
// Test en browser console (en /scan page después de scan):
const codes = ["E100", "E202", "E322", "E471"];
const start = performance.now();
const policies = await fetchENumberPolicies(supabase, user.id, codes);
const duration = performance.now() - start;
console.log(`Fetched ${codes.length} E-numbers in ${duration}ms`, policies);

// Expected: <100ms (vs ~500ms antes)
```

---

## 3️⃣ TAREA 3: Migrar Imágenes a Supabase Storage

### Objetivo

Mover imágenes de `extractions.image_base64` (TEXT) → Supabase Storage bucket → `extractions.source_ref` (URL).

**Beneficios:**
- 💰 **Costo**: Storage ~$0.021/GB/month << Database storage
- 🚀 **Performance**: CDN + caching automático
- 📦 **Scale**: Postgres no debe almacenar BLOBs
- 🔒 **Security**: RLS policies en bucket

### Fases de Implementación

#### FASE 1: Setup Bucket

**Manual en Supabase Dashboard:**

1. Ve a **Storage** → **Create Bucket**
2. Nombre: `scan-images`
3. **Public bucket**: NO (private)
4. **File size limit**: 10 MB
5. **Allowed MIME types**: `image/jpeg, image/png, image/webp`

**RLS Policies (SQL):**

```sql
-- Policy 1: Users can INSERT their own images
CREATE POLICY "Users can upload own scan images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scan-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can SELECT their own images
CREATE POLICY "Users can view own scan images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scan-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can DELETE their own images
CREATE POLICY "Users can delete own scan images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scan-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Path structure:** `{user_id}/{extraction_id}.jpg`

Example: `8f7e3c2a-1234-5678-90ab-cdef12345678/a3b2c1d0-9876-5432-10ab-fedcba098765.jpg`

#### FASE 2: Modificar Upload Flow

**Archivo:** `app/api/analyze/route.ts`

```typescript
// ... existing imports ...
import { createSupabaseServiceClient } from "@/lib/supabase/service";  // For Storage upload

export async function POST(request: Request) {
  return withSpan("POST /api/analyze", {}, async () => {
    // ... existing code hasta línea 236 ...

    // Persist extraction if user is authenticated
    if (!authError && user) {
      try {
        await withSpan(
          "extraction.persist",
          { mention_count: data.mentions.length },
          async () => {
            // 1. UPLOAD IMAGE TO STORAGE
            const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;

            const serviceSupabase = createSupabaseServiceClient();
            const { data: uploadData, error: uploadError } = await serviceSupabase
              .storage
              .from('scan-images')
              .upload(fileName, buffer, {
                contentType: mimeType,
                cacheControl: '3600',  // 1 hour cache
                upsert: false,
              });

            if (uploadError) {
              console.error('Storage upload error:', uploadError);
              throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            const storagePath = uploadData.path;

            // 2. INSERT EXTRACTION WITH source_ref (NOT image_base64)
            const extraction = await insertExtraction(supabase, {
              user_id: user.id,
              origin: "label",
              raw_text: data.ocr_text,
              raw_json: data as any,
              ocr_confidence: data.quality.confidence,
              vision_confidence: data.quality.confidence,
              model_confidence: data.quality.confidence,
              final_confidence: viewModel?.verdict.confidence ?? data.quality.confidence,
              label_hash: labelHash,
              source_ref: storagePath,  // ✅ Storage path
              image_base64: null,       // ✅ No longer storing base64
            });

            extractionId = extraction.id;

            // ... rest of token insertion code ...
          }
        );
      } catch (cause) {
        console.error("Error persistiendo extracción:", cause);
      }
    }

    // ... rest of response code ...
  });
}
```

#### FASE 3: Actualizar Queries para Leer de Storage

**Archivo:** `lib/supabase/queries/extractions.ts`

```typescript
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Generate signed URL for storage image
 *
 * @param storagePath - Path in scan-images bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
async function getSignedImageUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase.storage
    .from('scan-images')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Fetch extraction by ID (UPDATED FOR STORAGE)
 */
export async function getExtractionById(
  supabase: SupabaseClient<Database>,
  extractionId: string,
  userId: string
): Promise<{
  extraction: ExtractionRow;
  tokens: (TokenRow & { allergen_name?: string })[];
  imageUrl?: string;  // NEW: Signed URL
} | null> {
  // Fetch extraction
  const { data: extraction, error: extractionError } = await supabase
    .from("extractions")
    .select("*")
    .eq("id", extractionId)
    .eq("user_id", userId)
    .single();

  if (extractionError || !extraction) {
    console.error("Error fetching extraction:", extractionError);
    return null;
  }

  // Generate signed URL if source_ref exists
  let imageUrl: string | undefined;
  if (extraction.source_ref) {
    imageUrl = await getSignedImageUrl(extraction.source_ref) || undefined;
  } else if (extraction.image_base64) {
    // FALLBACK: Legacy base64 (during migration period)
    imageUrl = `data:image/jpeg;base64,${extraction.image_base64}`;
  }

  // ... fetch tokens code (unchanged) ...

  return {
    extraction,
    tokens: transformedTokens,
    imageUrl,  // NEW
  };
}
```

**Archivo:** `app/api/result/[id]/route.ts`

Actualizar para usar `imageUrl` del query:

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ... existing code ...

  const result = await getExtractionById(supabase, extractionId, user.id);

  if (!result) {
    return NextResponse.json(
      { error: "Análisis no encontrado." },
      { status: 404 }
    );
  }

  const { extraction, tokens, imageUrl } = result;

  // ... build viewModel ...

  // Use imageUrl instead of image_base64
  const viewModel = buildResultViewModel({
    analysis: extraction.raw_json as any,
    risk,
    profile: profilePayload,
    imageUrl,  // ✅ Signed URL from Storage
    model,
    costUSD: 0,
    scannedAt: extraction.created_at,
  });

  // ... rest of response ...
}
```

**Archivo:** `lib/risk/view-model.ts`

Update signature to accept `imageUrl` instead of `imageBase64`:

```typescript
export function buildResultViewModel(params: {
  analysis: IngredientsResult;
  risk: RiskAssessment;
  profile: ProfilePayload | null;
  imageUrl?: string;  // ✅ Changed from imageBase64
  model: string;
  costUSD: number;
  scannedAt?: string;
}): ResultViewModel {
  const {
    analysis,
    risk,
    profile,
    imageUrl,  // ✅ Changed
    model,
    costUSD,
    scannedAt,
  } = params;

  // ... existing code ...

  // Image section (simplified)
  const image: ResultViewModel['image'] = {
    thumbUrl: imageUrl || null,  // ✅ Direct URL (no base64 prefix needed)
    fullUrl: imageUrl || null,
    quality: analysis.quality.level,
    qualityLabel: analysis.quality.label,
  };

  // ... rest of code ...
}
```

#### FASE 4: Backfill (Migrar Imágenes Existentes)

**Script:** `scripts/migrate-images-to-storage.ts`

```typescript
/**
 * Backfill Script: Migrate existing base64 images to Supabase Storage
 *
 * Usage:
 *   npx tsx scripts/migrate-images-to-storage.ts
 *
 * What it does:
 * 1. Fetch all extractions with image_base64 != null
 * 2. For each extraction:
 *    a. Decode base64 → Buffer
 *    b. Upload to Storage: {user_id}/{extraction_id}.jpg
 *    c. Update source_ref with storage path
 *    d. Nullify image_base64 (don't drop column yet)
 * 3. Verify all uploads succeeded
 *
 * Safety:
 * - Runs in transaction per extraction (rollback on error)
 * - Keeps image_base64 as backup until manual verification
 * - Logs all operations for audit trail
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase credentials in .env");
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

interface MigrationResult {
  extractionId: string;
  status: "success" | "error";
  storagePath?: string;
  error?: string;
}

async function migrateImages(): Promise<MigrationResult[]> {
  console.log("🚀 Starting image migration to Storage...\n");

  // 1. Fetch all extractions with base64 images
  const { data: extractions, error: fetchError } = await supabase
    .from("extractions")
    .select("id, user_id, image_base64")
    .not("image_base64", "is", null)
    .is("source_ref", null);  // Only migrate if not already in Storage

  if (fetchError) {
    console.error("❌ Error fetching extractions:", fetchError);
    throw fetchError;
  }

  if (!extractions || extractions.length === 0) {
    console.log("✅ No images to migrate. All done!");
    return [];
  }

  console.log(`📦 Found ${extractions.length} images to migrate\n`);

  const results: MigrationResult[] = [];

  // 2. Migrate each extraction
  for (const extraction of extractions) {
    const { id, user_id, image_base64 } = extraction;

    try {
      console.log(`Processing extraction ${id}...`);

      if (!image_base64) {
        throw new Error("image_base64 is null (should not happen)");
      }

      // Decode base64
      const buffer = Buffer.from(image_base64, "base64");
      console.log(`  - Decoded ${buffer.length} bytes`);

      // Upload to Storage
      const fileName = `${user_id}/${id}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("scan-images")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const storagePath = uploadData.path;
      console.log(`  - Uploaded to: ${storagePath}`);

      // Update extraction: set source_ref, nullify image_base64
      const { error: updateError } = await supabase
        .from("extractions")
        .update({
          source_ref: storagePath,
          image_base64: null,  // Clear base64 (but column still exists)
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      console.log(`  ✅ Migrated successfully\n`);

      results.push({
        extractionId: id,
        status: "success",
        storagePath,
      });
    } catch (error: any) {
      console.error(`  ❌ Error migrating ${id}:`, error.message, "\n");

      results.push({
        extractionId: id,
        status: "error",
        error: error.message,
      });
    }
  }

  // 3. Summary
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total:    ${results.length}`);
  console.log(`Success:  ${successCount} ✅`);
  console.log(`Errors:   ${errorCount} ❌`);
  console.log("=".repeat(60) + "\n");

  if (errorCount > 0) {
    console.log("⚠️  Some migrations failed. Review errors above.");
    console.log("⚠️  Failed images still have base64 backup in DB.\n");
  } else {
    console.log("🎉 All images migrated successfully!");
    console.log("📌 Next step: Manually verify in Supabase Dashboard, then drop image_base64 column.\n");
  }

  return results;
}

// Run migration
migrateImages()
  .then(() => {
    console.log("✅ Migration script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
```

**Ejecutar:**

```bash
# Instalar tsx si no existe
npm install -D tsx

# Run migration
npx tsx scripts/migrate-images-to-storage.ts
```

#### FASE 5: Drop Column (DESPUÉS DE VALIDAR)

**⚠️ Solo ejecutar después de:**
1. Verificar que todas las imágenes están en Storage (Dashboard)
2. Probar que `/scan`, `/history`, `/scan/result/[id]` muestran imágenes correctamente
3. Esperar 1 semana de validación en producción

**Migración:** `supabase/migrations/YYYYMMDDHHMMSS_drop_image_base64.sql`

```sql
-- Migration: Drop image_base64 column (Storage migration complete)
--
-- PREREQUISITES:
-- 1. All images migrated to Storage
-- 2. source_ref populated for all extractions with images
-- 3. 1 week validation period completed
-- 4. Manual verification in Dashboard

-- Safety check: count extractions with base64 but no source_ref
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM extractions
  WHERE image_base64 IS NOT NULL
    AND source_ref IS NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Cannot drop image_base64: % extractions still have base64 but no source_ref', v_count;
  END IF;
END $$;

-- Drop column
ALTER TABLE extractions DROP COLUMN image_base64;

-- Regenerate types
COMMENT ON TABLE extractions IS 'Migration complete: image_base64 dropped, using source_ref for Storage URLs';
```

**Regenerar tipos:**

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/supabase/types.ts
```

---

## 📋 Checklist de Validación

### Tarea 1: Historial
- [ ] Página `/history` muestra todas las extracciones
- [ ] Paginación funciona (anterior/siguiente)
- [ ] Cards muestran: thumbnail, timestamp, verdict, allergen count
- [ ] Click en card navega a `/scan/result/[id]`
- [ ] Link "Ver Todo" funciona desde `RecentScans`
- [ ] Empty state cuando no hay scans
- [ ] Loading state mientras carga

### Tarea 2: E-numbers Batch
- [ ] Migración SQL ejecutada
- [ ] `decide_e_numbers_batch` RPC funciona
- [ ] `fetchENumberPolicies()` usa batch
- [ ] Latencia reducida (test con console.time)
- [ ] Policies correctas para cada E-number
- [ ] Manejo de E-numbers no existentes

### Tarea 3: Storage Migration
- [ ] Bucket `scan-images` creado
- [ ] RLS policies configuradas
- [ ] Upload de nuevas imágenes va a Storage
- [ ] `source_ref` se guarda correctamente
- [ ] Signed URLs se generan correctamente
- [ ] Backfill script ejecutado (13 imágenes)
- [ ] Imágenes visibles en Storage Dashboard
- [ ] `/scan` muestra imagen después de scan
- [ ] `/history` muestra thumbnails
- [ ] `/scan/result/[id]` muestra imagen
- [ ] Validación de 1 semana completa
- [ ] Column `image_base64` dropped
- [ ] Types regenerados

---

## 🎯 Orden de Ejecución Recomendado

### Semana 1: Historial (Quick Win)
1. Crear componentes de historial
2. Extender query con paginación
3. Crear página `/history`
4. Actualizar `RecentScans` con link
5. Probar y validar

### Semana 2: E-numbers Batch (Performance)
1. Crear migración SQL para batch RPC
2. Ejecutar migración
3. Actualizar `fetchENumberPolicies()`
4. Probar latencia (antes/después)
5. Validar policies correctas

### Semana 3-4: Storage Migration (Complejo)
1. **Día 1-2**: Setup bucket + RLS
2. **Día 3-4**: Modificar upload flow (nuevas imágenes)
3. **Día 5-6**: Actualizar queries para leer Storage
4. **Día 7**: Ejecutar backfill script
5. **Semana 4**: Validación y monitoreo
6. **Final**: Drop column image_base64

---

## 📚 Referencias

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [Batch RPCs](https://supabase.com/docs/guides/database/functions)

---

## ✅ Conclusión

Este plan mejora significativamente el scanner en:
- **UX**: Historial completo con paginación
- **Performance**: 10x reducción latencia E-numbers
- **Costo**: Reducción costos DB + preparación para escala
- **Arquitectura**: Separación de concerns (DB vs Storage)

**Tiempo estimado total**: 3-4 semanas
**Impacto**: 🔥 High (UX + Performance + Technical Debt)

¡Vamos! 🚀
