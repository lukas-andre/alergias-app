# Progress — Nutrición para Alergias

## 2025-10-27
- Reemplazado OCR local con integración OpenAI Responses (json_schema estricto) según backlog/openai-integration.md.
- Endpoint `/api/analyze` convierte imágenes a base64, invoca `extractIngredientsJSONViaSDK` y retorna JSON estructurado + métricas.
- UI de `/scan` actualizada: estados de carga, chips de ingredientes/alérgenos, advertencias, métricas de costo y paneles raw/estimación.
- Añadidos estimadores de costo dinámica en `lib/openai/cost-estimator.ts` y esquema vision helper en `lib/openai/vision.ts`.
- Ajustados estilos y landing para reflejar flujo OpenAI; README y `.env.example` documentan nueva configuración.

## 2025-10-28
- Integrado Supabase (helpers browser/server/service + provider tipado) y documentado en `docs/FIRST_STEPS.md`.
- Creado wizard `/profile` con autenticación Supabase, gestión de dietas/alergias/intolerancias y edición de estrictitud activa.
- Añadidos tipos `Database` generados manualmente en `lib/supabase/types.ts` + actualización de `.env.example` y README.
- El wizard ahora soporta overrides por alérgeno (trazas, e-números, ppm, notas) con guardado en `strictness_overrides`.
- Motor de riesgo (`lib/risk/evaluate.ts`) que combina el JSON de OpenAI con el perfil Supabase y devuelve acciones sugeridas.
- Simplificado el modelo de roles: único `owner` por usuario (asignado automáticamente desde el wizard) con políticas actualizadas en la guía.

## 2025-11-05
- **Corregidos flujos de autenticación Supabase:**
  - Creado `/app/auth/callback/route.ts` para manejar intercambio PKCE tras confirmación de email → usuarios ahora inician sesión automáticamente después de confirmar.
  - Añadido `router.refresh()` tras login manual en `/app/profile/page.tsx:643` → Server Components relecturan sesión inmediatamente.
  - Actualizado `lib/supabase/server.ts` a patrón oficial `getAll/setAll` y convertido a función async → evita fallos silenciosos de cookies en Route Handlers.
  - Removido `signOut()` conflictivo de `components/SupabaseProvider.tsx:36` → cliente gestiona su propio estado sin interferencias.
  - Actualizado bug React en handlers de form: capturar referencia del form antes de async (`app/profile/page.tsx:623, 651`) → previene error "Cannot read properties of null (reading 'reset')".
- **Configuración requerida:** Añadir `http://localhost:3000/auth/callback` (y variante de producción) a Redirect URLs en Supabase Dashboard.
- **Optimización de caché con SWR:**
  - Instalado `swr` para caché inteligente de datos del perfil.
  - Refactorizado `/app/profile/page.tsx` para usar `useSWR` con `revalidateOnFocus: false` y `revalidateOnReconnect: false` → ya no recarga datos al cambiar de pestaña.
  - `dedupingInterval: 60000` evita llamadas duplicadas al backend dentro de 1 minuto.
  - `handleSave` ahora usa `mutate()` para revalidar caché tras guardar cambios.
  - Mejoras de tipos en `lib/risk/evaluate.ts` para manejar `profile.strictness` nullable.

## Next Steps
- Validar con más etiquetas reales: comparar JSON vs. expectativa manual.
- Añadir persistencia/historial (localStorage o Supabase) y reglas de tráfico de color para MVP1.
- Incluir manejo de timeouts/reintentos en `/api/analyze` y telemetría básica.
