# AlergiasCL — Checklist de Tareas (Now / Next / Later)

**Versión:** v1
**Base:** Archivos 1 (Modelo), 2 (Features), 3 (Wireframes)

> Marcadores: `P0` = Now, `P1` = Next, `P2` = Later.
> Formato checklist para copiar a Jira/Issues.

---

## 0) Preparación / Infra (P0)

* [x] Crear repo monorepo (Next.js App Router + libs) o single app.
* [x] Configurar **Supabase** (proyecto, URL/keys, Auth Email/Password).
* [x] Configurar entornos: `.env.local` (anon), server `.env` (service-role).
* [x] Añadir **types** de DB: `supabase gen types` → `lib/supabase/types.ts`. ⚠️ **Regenerar después de aplicar migraciones**
* [x] Implementar **helpers** `lib/supabase/browser|server|service` (Archivo 1 §6.3).
* [ ] Agregar **Sentry/monitoring** (frontend + server actions) [opcional P0].
* [ ] Setup **CI** (build, typecheck, lint) + preview deployments.

## 1) Migraciones DB + RLS (P0) ✅

* [x] Correr migración **core** (Archivo 1 §13): diccionarios, perfiles, estrictitud, extractions, tokens, e_numbers, roles, auditoría. ✅ **14 migraciones en `supabase/migrations/`**
* [x] Crear triggers: `set_updated_at`, `ensure_default_strictness`, `grant_owner_role`. ✅ **Plus `log_dictionary_change`**
* [x] Activar RLS + **políticas**: diccionarios lectura pública; datos de usuario dueño; roles en backoffice. ✅ **44 políticas + helper `has_role()`**
* [x] Semilla mínima: `diet_types` (18), `allergen_types` (16), `intolerance_types` (9), `e_numbers` críticos (23). ✅ **296+ registros seeded**
* [x] Crear índices recomendados (trigram, compuestos). ✅ **Trigram en synonyms, extractions, tokens**
* [x] Tablas **app_settings** (feature flags) [Archivo 2 §7]. ✅ **16 settings seeded**
* [x] Seed migrations: **diet_types**, **allergen_types**, **allergen_synonyms** (230), **intolerance_types**, **e_numbers**, **app_settings**. ✅ **Todas aplicadas correctamente con MCP Supabase**

## 2) RPCs / Server (P0) ✅

* [x] `get_my_profile_payload()` (wrapper de `get_profile_payload`). ✅
* [x] `decide_e_number(user, code)` (política e‑codes). ✅
* [x] (P1) `get_effective_strictness_map(user)`. ✅ **Implementado (batch optimization)**
* [x] Endpoints API: `/api/profile` (GET), `/api/scan` (POST). ⚠️ **`/api/feedback` pendiente**

## 3) Onboarding (Wizard 7 pasos) (P0) ✅

* [x] UI base `/onboarding` con steps (search params `?step=n`). ✅ **Orchestrator implementado**
* [x] **Paso 1** Bienvenida + privacidad. ✅ **WelcomeStep.tsx con OnboardingLayoutCompact**
* [x] **Paso 2** Datos básicos (`display_name`, `notes`, `pregnant`). ✅ **BasicDataStep.tsx**
* [x] **Paso 3** Dietas (chips) con búsqueda. ✅ **DietsStep.tsx con SearchableMultiSelect**
* [x] **Paso 4** Alergias: buscador con **sinónimos** (trigram), chips + severidad 0..3. ✅ **AllergensStep.tsx con SeveritySelector**
* [x] **Paso 5** Intolerancias (igual patrón). ✅ **IntolerancesStep.tsx**
* [x] **Paso 6** Estrictitud activa: toggles + selects (`block_traces`, `same_line`, `e_numbers_uncertain`, `min_conf`, `pediatric`, `anaphylaxis`). ✅ **StrictnessStep.tsx con StrictnessToggles**
* [x] **Paso 7** Revisión final + confirmar. ✅ **ReviewStep.tsx con summary cards**
* [x] Persistencia por paso (optimistic + retry) y reanudación. ✅ **localStorage con lib/onboarding/persistence.ts**
* [x] DB tracking: `onboarding_completed_at` field. ✅ **Migration aplicada**
* [x] Design System: Tailwind + shadcn/ui + Purple Theme. ✅ **docs/DESIGN_SYSTEM.md**
* [x] Shared Components: ProgressIndicator, OnboardingLayout, SearchableMultiSelect, SeveritySelector, StrictnessToggles. ✅ **5 componentes reusables**
* [x] **Auth Flow Integration**: middleware.ts, auth/callback smart redirects, landing page auth-aware. ✅ **Email confirmation → onboarding flow**
* [x] **Dedicated Auth Pages**: /login and /signup with redirect support. ✅ **Extracted from /profile**
* [ ] Telemetría: `onboarding_step`, tiempo, abandonos. ⏳ **Pendiente**

## 4) Perfil / Estrictitud (edición rápida) (P0) ⚠️ **Parcial**

* [x] `/profile` CRUD dietas/alergias/intolerancias con chips. ✅ **Wizard completo con 5 steps**
* [x] **Auth forms extracted**: /login y /signup dedicados. ✅ **profile refactored**
* [x] **Navigation**: Profile ↔ Scanner links added. ✅ **Bidirectional navigation**
* [ ] `/profile/strictness` edición del perfil activo. ⏳ **Pendiente (actualmente en main wizard)**
* [ ] `/profile/strictness/[allergenKey]` overrides locales. ⏳ **Pendiente (actualmente inline en paso allergens)**

## 5) Scanner etiqueta → Semáforo (P0)

* [ ] Página `/scan` (dropzone, cámara, pegar texto) + historial corto.
* [ ] Handler `/api/scan`: subir, llamar LLM visión, normalizar, guardar en `extractions`/`extraction_tokens`.
* [ ] Motor riesgo: aplicar `get_my_profile_payload` + `decide_e_number` + reglas de estrictitud.
* [ ] Página `/scan/result/[id]`: semáforo, **evidencia** (tokens + spans), e‑codes con policy.
* [ ] Acciones: **Guardar**, **Ver alternativas** (placeholder), **Reportar error**.
* [ ] Cache por `label_hash` (evitar re‑inferencia del mismo texto/imagen).

## 6) Backoffice (P0)

* [ ] Layout `/admin` con control de roles (`owner`, `nutritionist`, `moderator`).
* [ ] **Diccionarios** `/admin/dictionaries` (tabs): CRUD `allergen_types`, `diet_types`, `intolerance_types`.
* [ ] **Sinónimos** `/admin/synonyms`: chips con peso/locale + **preview de matching**.
* [ ] **E‑numbers** `/admin/enumbers`: CRUD + import/export simple.
* [ ] **Auditoría** `/admin/audit`: lista con diff `old→new` (de `dictionary_changes`).
* [ ] **Settings** `/admin/settings`: toggles de `app_settings` (onboarding/menus/map/diary...).

## 7) Telemetría + Feedback (P0)

* [ ] Instrumentar eventos (frontend y API) con IDs anónimos.
* [ ] Endpoint `/api/feedback` con adjuntos (opcional Supabase Storage).
* [ ] Panel simple de feedback (tabla interna o en admin).

## 8) Seguridad / Privacidad (P0)

* [ ] Validar **RLS** con tests (no filtrar data de otros usuarios).
* [ ] Política de retención de imágenes: borrar post‑inferencia (opción) o marcar TTL.
* [ ] Copy de privacidad y disclaimer médico en onboarding y scan.

## 9) Research / Seeds (continuo)

* [ ] (Alta) **E‑numbers**: preparar CSV/JSON maestro (campos Archivo 2 §6.1) y proceso de import.
* [ ] (Alta) **Sinónimos ES‑CL**: expandir catálogo y falsos amigos.
* [ ] (Media) **Heurísticas de frases**: “trazas”, “misma línea”, “libre de”.

## 10) P1 (Next)

* [ ] Menús/PDF/URL `/menus` + `/api/menus` (origin=`menu`).
* [ ] Alternativas seguras (embeddings o taxonomía seed) + UI en resultado de scan.
* [ ] `get_effective_strictness_map` para bajar latencia.
* [ ] Importadores CSV/JSON (dry‑run, validación).
* [ ] Versionado de receta + notificación a usuarios (comparar `label_hash`).

## 11) P2 (Later)

* [ ] **Mapa** `/map` + `venue_*`: submissions, aprobaciones por nutricionistas, tags y ficha.
* [ ] **Diario** `/diary`: foto→ingredientes con confirmación; export PDF/CSV.
* [ ] Modo **offline parcial** (bundle diccionarios + reglas mínimas; cola de sync).
* [ ] Tarjeta de **emergencia** + traducciones controladas.

## 12) QA / Testing

* [ ] Unit tests (normalizador tokens, reglas riesgo, RPC adapters).
* [ ] Integración (API `/api/scan` contra DB real en test).
* [ ] E2E (Playwright): onboarding, scan happy path, backoffice CRUD.
* [ ] Performance budgets: p50/p95 de `/api/scan` y FCP en `/scan`.

## 13) DevOps / Entrega

* [ ] Pipelines CI: lint/typecheck/test; despliegue a `preview` y `prod` con gates.
* [ ] Feature toggles por entorno (app_settings + seed por env).
* [ ] Alertas básicas (fallo de API, latencia, tasa de errores).

## 14) Definition of Done (aplica a cada feature)

* [ ] Criterios de aceptación en Jira.
* [ ] Tests mínimos (unit o e2e) y métricas instrumentadas.
* [ ] Accesibilidad (navegación teclado, contrastes, labels ARIA).
* [ ] Documentación corta (README/Confluence) + captura de pantalla.

---

### Notas

* Las rutas/API y componentes referencian **Archivo 3**.
* El modelo y RLS referencian **Archivo 1**.
* La priorización viene de **Archivo 2**.

> Sugerencia: crear **épicas** por F01–F14 (Archivo 2 §8) y poblar con estas tareas como subtickets.

---

## 15) Auth Flow Integration (Completed January 2025) ✅

### Objetivo
Integrar completamente el flujo de autenticación con el onboarding, asegurando que:
- Nuevos usuarios sean redirigidos automáticamente al onboarding después de confirmar su email
- Usuarios que completen el onboarding vayan directamente al scanner
- Usuarios autenticados sin onboarding sean forzados a completarlo antes de acceder a rutas protegidas
- Landing page muestre CTAs inteligentes según el estado de autenticación

### Implementación

#### 1. Database & Types
- **lib/supabase/types.ts**: Añadido campo `onboarding_completed_at: string | null` a `user_profiles`
  - Row, Insert, Update types actualizados
  - Permite tracking del estado de onboarding

#### 2. Route Protection (middleware.ts) ✅
**Archivo:** `middleware.ts` (NUEVO)

**Casos manejados:**
```typescript
// CASE 1: No autenticado
- Acceso a rutas protegidas (/scan, /profile, /onboarding) → redirige a "/"
- Acceso a rutas públicas (/, /login, /signup) → permite

// CASE 2A: Autenticado SIN onboarding
- Ya en /onboarding → permite
- Intentando acceder a otras rutas → fuerza a /onboarding
- En /login o /signup → redirige a /onboarding

// CASE 2B: Autenticado CON onboarding
- Intentando acceder a /onboarding → redirige a /scan
- En /login o /signup → redirige a /scan
- Otras rutas → permite
```

**Matcher configurado:**
```javascript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)"
]
```

#### 3. Email Confirmation Flow (app/auth/callback/route.ts) ✅
**Smart Redirect Logic:**
1. Intercambia código PKCE por sesión
2. Consulta `user_profiles.onboarding_completed_at`
3. Decide redirección:
   - `onboarding_completed_at` NULL → `/onboarding` (nuevo usuario)
   - `onboarding_completed_at` presente → `/scan` (usuario returning)
   - Parámetro `?next=` personalizado → respeta override

**Ejemplo:**
```
Email link: https://app.com/auth/callback?code=abc123
Usuario nuevo → https://app.com/onboarding
Usuario existente → https://app.com/scan
Con override → https://app.com/auth/callback?code=abc123&next=/profile
```

#### 4. Landing Page Auth-Aware (app/page.tsx) ✅
**Archivo:** Reescrito completamente como client component

**Estados de usuario:**
```typescript
type UserState = "loading" | "unauthenticated" | "needs_onboarding" | "ready"
```

**CTA dinámicos:**
| Estado | Botón | Icono | Destino |
|--------|-------|-------|---------|
| unauthenticated | "Comenzar Ahora" | Heart | /signup |
| needs_onboarding | "Completar Configuración" | ShieldCheck | /onboarding |
| ready | "Ir al Escáner" | Scan | /scan |

**Features:**
- Header condicional: "Iniciar Sesión" (unauth) vs "Mi Perfil" (ready)
- Trust badge para usuarios completados
- Warning badge para usuarios incompletos
- Features grid con Escaneo Inteligente, Perfil Personalizado, Para Toda la Familia
- "Cómo funciona" section con 3 pasos

#### 5. Dedicated Auth Pages ✅

**app/login/page.tsx:**
- Form: email + password
- Loader con spinner durante sign in
- Error handling con mensajes en español
- Link a /signup: "¿No tienes cuenta? Crear Cuenta Nueva"
- Soporte `?redirect=/custom-path` query param
- Design system: shadcn/ui Card + primary theme

**app/signup/page.tsx:**
- Form: email + password + confirm password
- Validación client-side (mínimo 6 chars, passwords match)
- **Success state** con instrucciones post-registro:
  1. Revisar email
  2. Clic en enlace confirmación
  3. Redirigido a onboarding
  4. Completar perfil (7 pasos, 5 min)
- Link a /login: "¿Ya tienes cuenta? Iniciar Sesión"
- Disclaimer médico en form
- `emailRedirectTo` configurado en signUp options

#### 6. Profile Page Refactor (app/profile/page.tsx) ✅
**Cambios:**
- ❌ Removidos: `handleSignIn()`, `handleSignUp()` (lines 638-693)
- ❌ Removido: Auth forms UI (lines 1173-1217)
- ✅ Simplificado loading state (middleware garantiza auth)
- ✅ Añadida navegación: "← Volver al Escáner" + "Cerrar sesión"

**Rationale:** Middleware protege la ruta, no se puede acceder sin auth. Forms movidos a /login y /signup.

#### 7. Scanner Page Navigation (app/scan/page.tsx) ✅
**Añadido header:**
```tsx
<header className="flex items-center justify-between mb-8 pb-4 border-b">
  <Link href="/"><Button variant="ghost">← Inicio</Button></Link>
  <Link href="/profile"><Button variant="outline">🧑 Editar Perfil</Button></Link>
</header>
```

### User Journeys

#### Journey 1: Nuevo usuario (Happy Path)
1. Visita `/` → Ve "Comenzar Ahora"
2. Clic → Redirige a `/signup`
3. Llena form → Submit exitoso
4. Ve success screen: "Revisa tu correo"
5. Recibe email con link → Clic
6. `/auth/callback` verifica `onboarding_completed_at` = NULL
7. Redirige a `/onboarding?step=1`
8. Completa 7 pasos → Sets `onboarding_completed_at = NOW()`
9. Redirige a `/scan` (ready to use app)

#### Journey 2: Usuario returning (onboarding completo)
1. Visita `/` → Ve "Ir al Escáner"
2. Ya loggeado + onboarding completo
3. Clic → Directo a `/scan`
4. Puede ir a `/profile` desde header

#### Journey 3: Usuario interrupted (login sin onboarding)
1. Usuario creó cuenta pero nunca completó onboarding
2. Visita `/login` → Ingresa credenciales
3. Middleware detecta `onboarding_completed_at` NULL
4. Fuerza redirect a `/onboarding`
5. Completa wizard → Luego puede acceder a `/scan`

#### Journey 4: Intentando acceder a ruta protegida sin auth
1. Usuario no loggeado visita `/scan` directamente
2. Middleware intercepta: `!session && isProtectedRoute`
3. Redirige a `/` (landing page)
4. Debe hacer signup/login primero

### Files Modified/Created

**Created:**
- `middleware.ts` (115 lines) - Route protection core
- `app/login/page.tsx` (175 lines) - Dedicated login
- `app/signup/page.tsx` (250 lines) - Dedicated signup with success state

**Modified:**
- `lib/supabase/types.ts` - Added onboarding_completed_at field
- `app/auth/callback/route.ts` - Smart redirect logic (lines 34-49)
- `app/page.tsx` - Complete rewrite as auth-aware landing (283 lines)
- `app/profile/page.tsx` - Removed auth forms (lines 638-693, 1173-1217)
- `app/scan/page.tsx` - Added navigation header (lines 157-171)

### Testing Checklist

- [ ] **Nuevo usuario:**
  - [ ] Signup → email confirmation → auto-redirect to /onboarding
  - [ ] Completar onboarding → redirect to /scan
  - [ ] `onboarding_completed_at` timestamp guardado en DB

- [ ] **Usuario returning:**
  - [ ] Login → auto-redirect to /scan (no onboarding prompt)
  - [ ] Landing page muestra "Ir al Escáner" CTA

- [ ] **Usuario incompleto:**
  - [ ] Login sin onboarding → forzado a /onboarding
  - [ ] No puede acceder a /scan o /profile hasta completar

- [ ] **Route protection:**
  - [ ] Unauth user visita /scan → redirect a /
  - [ ] Unauth user visita /profile → redirect a /
  - [ ] Unauth user visita /onboarding → redirect a /
  - [ ] Auth user con onboarding visita /onboarding → redirect a /scan

- [ ] **Navigation:**
  - [ ] /scan tiene link "Editar Perfil" → /profile
  - [ ] /profile tiene link "Volver al Escáner" → /scan
  - [ ] /login tiene link "Crear Cuenta Nueva" → /signup
  - [ ] /signup tiene link "Iniciar Sesión" → /login

- [ ] **Redirect param:**
  - [ ] /login?redirect=/profile funciona post-login
  - [ ] Callback respeta ?next= parameter

### Known Issues / Future Work

- **Email template**: Personalizar template de confirmación de Supabase con branding AlergiasCL
- **Password reset**: Falta flow de "Olvidé mi contraseña" en /login
- **Social auth**: No hay Google/Apple sign in (futuro P1)
- **Session persistence**: Verificar behavior en mobile (cookie vs localStorage)
- **Onboarding resume**: Si usuario abandona en step 3, debe poder retomar (localStorage ya implementado)

### Metrics / Impact

- **User experience:** Reduce friction, guía claramente el onboarding
- **Security:** Middleware server-side previene acceso a rutas protegidas
- **Maintainability:** Auth forms centralizados, no duplicados en múltiples páginas
- **Conversion:** Success state en signup mejora tasa de confirmación de email

---

## Section 16: Onboarding Visual Design - Tech-Care Purple Theme

**Date:** 2025-01-06
**Status:** ✅ Completed
**Objective:** Fix onboarding visual issues, apply Tech-Care Purple color scheme (#7C3AED), and ensure proper contrast throughout the wizard.

### Problem Statement

After implementing auth flows, onboarding had major visual issues:

1. **Missing colors**: Buttons and UI elements had no color (transparent/gray)
2. **Broken stepper**: Progress indicator showed no purple for current step, no green for completed
3. **Poor contrast**: Checkbox marks invisible, button text unreadable
4. **Wrong backgrounds**: Purple gradient backgrounds instead of clean white
5. **Tailwind v4 issue**: `bg-primary` classes not generating CSS

### Root Cause Analysis

**Tailwind v4 + @tailwindcss/postcss** works differently than v3:
- Colors must be defined in `@theme` directive in `globals.css`
- Need **DEFAULT variants** (e.g., `--color-primary`) to generate utility classes like `bg-primary`
- Need **foreground variants** (e.g., `--color-primary-foreground`) for text on colored backgrounds
- `tailwind.config.ts` color definitions don't automatically generate classes in v4

### Changes Made

#### 1. Fixed Tailwind v4 Color Theme (`app/globals.css`)

Added DEFAULT and foreground variants to `@theme`:

```css
@theme {
  /* Primary Purple - Tech-Care */
  --color-primary: #7c3aed; /* DEFAULT - generates bg-primary, text-primary */
  --color-primary-foreground: #ffffff; /* White text on purple backgrounds */
  --color-primary-50: #faf5ff;
  --color-primary-600: #7c3aed;
  --color-primary-900: #4c1d95;
  /* ... all shades */

  /* Accent Fresh (Green) - for completed steps */
  --color-accent-fresh: #22c55e; /* DEFAULT - generates bg-accent-fresh */
  --color-accent-fresh-foreground: #ffffff;
  /* ... all shades */

  /* Accent Scan (Teal) - for scanner UI */
  --color-accent-scan: #2dd4bf; /* DEFAULT - generates bg-accent-scan */
  --color-accent-scan-foreground: #ffffff;
  /* ... all shades */
}
```

**Key insight:** Without `--color-primary` (no number suffix), Tailwind v4 won't generate `bg-primary` class.

#### 2. Fixed Onboarding Backgrounds (`components/onboarding/OnboardingLayout.tsx`)

**Before:**
- Welcome step: `bg-gradient-to-br from-primary-50 to-primary-100` (purple gradient)
- Steps 2-7: `bg-neutral-50` (gray background)

**After:**
- Welcome step: `bg-white` (clean white)
- Steps 2-7: `bg-white` (clean white)

Lines changed: 68, 213

#### 3. Fixed Form Label Context Errors

**Issue:** `FormLabel` used outside `<FormField>` context caused runtime errors.

**Files fixed:**
- `app/onboarding/steps/AllergensStep.tsx` line 163
- `app/onboarding/steps/IntolerancesStep.tsx` line 158

**Solution:** Changed `<FormLabel>` to `<label>` for standalone labels not connected to form fields.

```tsx
// Before (ERROR)
<FormLabel className="flex items-center gap-2 text-base">
  <AlertCircle className="w-4 h-4 text-danger" />
  Busca y selecciona tus alergias
</FormLabel>

// After (FIXED)
<label className="flex items-center gap-2 text-base font-medium">
  <AlertCircle className="w-4 h-4 text-danger" />
  Busca y selecciona tus alergias
</label>
```

#### 4. Session Management in Onboarding (`app/onboarding/page.tsx`)

**Issue:** Original code expected `{ session }` from `useSupabase()` but provider only returned client.

**Solution:** Fetch session when needed instead of storing in state (avoids infinite loops).

```tsx
// Get session inline when needed
const { data: { session } } = await supabase.auth.getSession();

// Use in handleFinish for submission
const handleFinish = async () => {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error("No user session");
  }
  // ... continue with submission
};
```

### Files Modified

```
app/globals.css                                    # Added @theme DEFAULT colors
components/onboarding/OnboardingLayout.tsx         # Changed backgrounds to white
app/onboarding/steps/AllergensStep.tsx            # Fixed FormLabel → label
app/onboarding/steps/IntolerancesStep.tsx         # Fixed FormLabel → label
app/onboarding/page.tsx                            # Fixed session management
```

### Visual Results

**Before:**
- ❌ Buttons: Gray/transparent, text unreadable
- ❌ Stepper: All gray, no color distinction
- ❌ Checkboxes: Purple background but purple check mark (invisible)
- ❌ Backgrounds: Unwanted purple gradients

**After:**
- ✅ Buttons: Tech-Care Purple (#7C3AED) with white text (excellent contrast)
- ✅ Stepper: Purple for current step, green for completed, gray for pending
- ✅ Checkboxes: Purple background with white check mark (visible)
- ✅ Backgrounds: Clean white throughout

### Tailwind v4 Learnings

**Critical differences from v3:**

1. **Color generation:** Must define `--color-NAME` (no suffix) to generate `bg-NAME` utility
2. **Foreground colors:** Must define `--color-NAME-foreground` for text contrast
3. **@theme directive:** Primary source of truth, `tailwind.config.ts` colors ignored for utility generation
4. **No automatic HSL mapping:** Can't use `hsl(var(--primary))` in config, must use hex in @theme

**Example pattern:**
```css
/* Generates: bg-primary, text-primary, border-primary */
--color-primary: #7c3aed;

/* Generates: text-primary-foreground (for use with bg-primary) */
--color-primary-foreground: #ffffff;

/* Generates: bg-primary-600, text-primary-600 */
--color-primary-600: #7c3aed;
```

### Testing Checklist

- [x] Welcome step: White background, purple button with white text
- [x] Stepper: Purple circle for current step (step 2)
- [x] Stepper: Green circles for completed steps (step 1)
- [x] Stepper: Gray circles for pending steps (steps 3-7)
- [x] Checkboxes: Purple when checked with visible white checkmark
- [x] Button contrast: All primary buttons have white text on purple
- [x] Navigation: "Continuar" button clearly visible
- [x] Form submission: No "No user session" error
- [x] No infinite render loops

### Design System Tokens

**Tech-Care Purple Palette:**
- Primary: `#7C3AED` (Violet 600) - Main brand color
- Primary Dark: `#4C1D95` (Violet 900) - Dark accents
- Primary Soft: `#EDE9FE` (Violet 100) - Soft backgrounds
- Accent Fresh: `#22C55E` (Green 500) - Success/completed states
- Accent Scan: `#2DD4BF` (Teal 400) - Scanner highlights
- Neutrals: `#0F172A` (text), `#F8FAFC` (backgrounds)

**Usage Guidelines:**
- ✅ Use purple for: Primary buttons, active states, current step indicator, links
- ✅ Use green for: Completed steps, success messages, confirmations
- ✅ Use white backgrounds only (no gradients, no grays)
- ✅ Always pair colored backgrounds with white text for contrast
- ❌ Never use purple for page backgrounds
- ❌ Never use colored text on colored backgrounds of similar hue

### Known Issues / Future Work

- **Mobile stepper:** Test on small screens, may need compact variant
- **Dark mode:** HSL variables exist but dark theme not fully tested
- **Accessibility:** Run WCAG contrast checker on all purple/white combinations
- **Animation:** Consider subtle transitions when stepper updates

### Related Documentation

- Tailwind v4 migration: https://tailwindcss.com/docs/v4-beta
- @theme directive: https://tailwindcss.com/docs/theme-configuration
- Color naming conventions: See `tailwind.config.ts` comments
- Design system: `CLAUDE.md` Section 6

---
