# Admin Panel Documentation

Complete guide for using and maintaining the AlergiasCL admin panel.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Admin](#creating-your-first-admin)
3. [Admin Panel Sections](#admin-panel-sections)
4. [Security Model](#security-model)
5. [API Documentation](#api-documentation)
6. [Development Guide](#development-guide)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Supabase project set up and running
- Database migrations applied
- Environment variables configured

### Access the Admin Panel

Navigate to: `https://your-domain.com/admin`

**Requirements:**
- You must be authenticated (logged in)
- You must have the `owner` role assigned

If you don't have access, you'll be redirected to `/scan` with an `unauthorized` error.

---

## Creating Your First Admin

### Step 1: Find Your User ID

1. Go to Supabase Dashboard → SQL Editor
2. Run this query with your email:

```sql
SELECT
  id as user_id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

3. Copy your `user_id` (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Grant Owner Role

Run this SQL query in Supabase Dashboard → SQL Editor:

```sql
INSERT INTO user_roles (user_id, role_key)
SELECT
  id,
  'owner'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role_key) DO NOTHING;
```

### Step 3: Verify Admin Access

```sql
SELECT
  au.email,
  ur.role_key,
  ur.user_id
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'your-email@example.com'
ORDER BY ur.role_key;
```

You should see **two rows**:
- One with `role_key = 'user'` (auto-assigned to all users)
- One with `role_key = 'owner'` (just added)

### Step 4: Access Admin Panel

1. Log out and log back in (to refresh session)
2. Navigate to `/admin`
3. You should now see the admin dashboard

---

## Admin Panel Sections

### Dashboard (`/admin`)

**Purpose**: Overview of system data and quick access to common tasks

**Features**:
- Statistics cards showing counts for each dictionary type
- Quick action links to main admin sections
- Priority badges for important sections

---

### E-numbers (`/admin/e-numbers`) 🔴 **PRIORITY 1**

**Purpose**: Manage food additives (E-numbers) and their allergen links

**Features**:
- **List View**: Search, filter, and view all E-numbers
- **Create**: Add new E-number with validation
- **Edit**: Update existing E-number details
- **Delete**: Remove E-number (with warning if linked to allergens)

**Fields**:
- `code` (string, required): E-number code (e.g., `E322`, `E110a`)
  - Pattern: `E[0-9]+[a-z]*`
  - Auto-uppercased
- `name_es` (string, required): Spanish name (e.g., `Lecitina`)
- `likely_origins` (string[], required): Possible sources (e.g., `["soja", "girasol", "huevo"]`)
- `linked_allergen_keys` (string[], optional): Allergen keys this additive may contain
- `residual_protein_risk` (boolean): Whether this additive carries protein risk from source
- `notes` (string, optional): Additional information

**Use Cases**:
- Scanner uses this to identify allergens in processed foods
- Risk engine checks if E-numbers are linked to user's allergens
- Users see E-numbers highlighted in scan results

**Audit**: All changes logged to `dictionary_changes` table

---

### Dictionaries (`/admin/dictionaries`)

**Purpose**: Manage core data types (allergens, diets, intolerances)

**Sections** (Tabbed Interface):

#### Tab 1: Allergen Types
- Allergen categories users can select in onboarding
- Fields: `key`, `name_es`, `notes`, `synonyms` (deprecated - use Synonyms section)

#### Tab 2: Diet Types
- Diet categories (vegan, vegetarian, celiac, etc.)
- Fields: `key`, `name_es`, `description`

#### Tab 3: Intolerance Types
- Intolerance categories (lactose, fructose, etc.)
- Fields: `key`, `name_es`, `notes`, `synonyms` (deprecated)

**Key Rules**:
- Must be lowercase alphanumeric with dashes/underscores
- Used as identifiers throughout the system
- Cannot be changed after creation (for data integrity)

**Audit**: All changes logged to `dictionary_changes` table

---

### Synonyms (`/admin/synonyms`)

**Purpose**: Add alternative names for allergens to improve OpenAI matching

**Features**:
- Filter by allergen
- Manage surface forms with weight and locale
- Preview matching (shows how input would match existing synonyms)

**Fields**:
- `allergen_id` (UUID, required): Reference to allergen type
- `surface` (string, required): Alternative name (e.g., `"maíz"`, `"corn"`, `"elote"`)
- `locale` (string, default `es-CL`): Language/region code
- `weight` (1-3, default 1): Priority for matching
  - `1` = Normal
  - `2` = High priority
  - `3` = Very high priority (rare, specific cases)

**How it works**:
- OpenAI extracts ingredients from label
- Synonyms table provides fuzzy matching via trigram index
- Higher weight synonyms match more readily

**Use Cases**:
- Add regional variations (e.g., `"elote"` for `"maíz"` in Mexico)
- Add common misspellings
- Add scientific names
- Add brand-specific names

**Audit**: All changes logged to `dictionary_changes` table

---

### Settings (`/admin/settings`)

**Purpose**: Configure global app behavior and feature flags

**Features**:
- View all app settings
- Edit setting values (JSON or form-based)
- Toggle boolean settings with switch

**Common Settings**:
- `scanner.enabled`: Enable/disable scanner feature
- `onboarding.required`: Force onboarding for new users
- `cache.ttl_days`: Days to keep cached scans
- `feedback.enabled`: Enable user feedback submissions

**Format**:
- Settings stored as JSON in `app_settings` table
- Can be any valid JSON value (boolean, string, number, object, array)

**Audit**: All changes logged to `dictionary_changes` table

---

### Audit Log (`/admin/audit`)

**Purpose**: Review all changes to dictionary tables

**Features**:
- Filter by table name
- Filter by action (insert/update/delete)
- Date range filtering
- View diff (old_data → new_data)

**Tables Tracked**:
- `allergen_types`
- `diet_types`
- `intolerance_types`
- `e_numbers`
- `allergen_synonyms`

**Audit Entry Fields**:
- `id` (UUID): Unique audit entry ID
- `table_name` (string): Which table was changed
- `row_id` (UUID): ID of the affected row
- `action` (insert/update/delete): What happened
- `old_data` (JSON): Previous state (null for inserts)
- `new_data` (JSON): New state (null for deletes)
- `changed_by` (UUID): User who made the change
- `changed_at` (timestamp): When the change occurred

**Use Cases**:
- Track who changed what and when
- Investigate data issues
- Rollback changes manually if needed
- Compliance and accountability

---

## Security Model

### Role Hierarchy

**`owner` (Admin)**:
- Full access to all admin features
- Can manage users and roles
- Can create/edit/delete all dictionaries
- Can view audit log

**`moderator`**:
- Can edit dictionaries (allergens, diets, intolerances, e-numbers)
- Cannot delete or manage users
- Can view audit log

**`nutritionist`**:
- Reserved for future features (venue/recipe approval)
- Currently same permissions as user

**`user`**:
- Regular user with no admin access
- Auto-assigned to all new users

### Permission Matrix

| Action | owner | moderator | nutritionist | user |
|--------|-------|-----------|--------------|------|
| View dashboard | ✅ | ✅ | ❌ | ❌ |
| Create/Edit dictionaries | ✅ | ✅ | ❌ | ❌ |
| Delete dictionaries | ✅ | ❌ | ❌ | ❌ |
| Manage E-numbers | ✅ | ✅ | ❌ | ❌ |
| Manage synonyms | ✅ | ✅ | ❌ | ❌ |
| Edit settings | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| Manage users/roles | ✅ | ❌ | ❌ | ❌ |

### RLS (Row Level Security)

All admin operations use **service client** (bypasses RLS) in API routes, but:
- API routes check for `owner` role before allowing access
- Middleware blocks `/admin/*` routes for non-owners
- Double layer of security (middleware + API route check)

**Important**: NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.

---

## API Documentation

### E-numbers API

**List all E-numbers**:
```http
GET /api/admin/e-numbers
Authorization: Bearer <session-token>
```

**Create E-number**:
```http
POST /api/admin/e-numbers
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "code": "E322",
  "name_es": "Lecitina",
  "likely_origins": ["soja", "girasol", "huevo"],
  "linked_allergen_keys": ["soja", "huevo"],
  "residual_protein_risk": true,
  "notes": "Common emulsifier"
}
```

**Update E-number**:
```http
PATCH /api/admin/e-numbers/E322
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name_es": "Lecitina de Soja",
  "notes": "Updated description"
}
```

**Delete E-number**:
```http
DELETE /api/admin/e-numbers/E322
Authorization: Bearer <session-token>
```

### Error Responses

All API routes return standard error format:

```json
{
  "error": "Human-readable error message",
  "details": { /* Optional additional details */ }
}
```

**Status Codes**:
- `200` OK
- `201` Created
- `400` Bad Request (validation failed)
- `401` Unauthorized (not logged in)
- `403` Forbidden (not admin)
- `404` Not Found
- `409` Conflict (duplicate key)
- `500` Internal Server Error

---

## Development Guide

### Adding a New Admin Section

**1. Create API Route** (`app/api/admin/[resource]/route.ts`):
```typescript
export async function GET() {
  // Check admin access
  const supabase = await createSupabaseServerClient();
  const { data: hasOwnerRole } = await supabase.rpc("has_role", {
    p_role_key: "owner",
  });

  if (!hasOwnerRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service client for data access
  const serviceClient = createSupabaseServiceClient();
  const { data } = await serviceClient.from("my_table").select("*");
  return NextResponse.json(data);
}
```

**2. Create Validation Schema** (`lib/admin/validation.ts`):
```typescript
export const myResourceSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
});
```

**3. Create API Client Functions** (`lib/admin/api-client.ts`):
```typescript
export async function fetchMyResources(): Promise<MyResource[]> {
  const response = await fetch("/api/admin/my-resource");
  return handleResponse<MyResource[]>(response);
}
```

**4. Create Page** (`app/admin/my-resource/page.tsx`):
- Use `DataTable` component for list view
- Create dialog components for CRUD operations
- Handle loading states and errors

**5. Update Navigation** (`components/admin/AdminNav.tsx`):
- Add new nav item with icon and href

---

## Troubleshooting

### "Unauthorized" Error When Accessing /admin

**Cause**: You don't have the `owner` role assigned

**Fix**: Follow "Creating Your First Admin" section above

---

### "Failed to load e-numbers" Toast

**Causes**:
1. Not authenticated
2. Network error
3. API route error

**Debug**:
1. Check browser console for errors
2. Check Network tab in DevTools
3. Verify API route is deployed
4. Check Supabase logs

---

### Changes Not Appearing in Audit Log

**Cause**: Trigger `log_dictionary_change()` not attached to table

**Fix**: Ensure migration includes:
```sql
CREATE TRIGGER log_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON my_table
FOR EACH ROW EXECUTE FUNCTION log_dictionary_change();
```

---

### "Validation failed" When Creating E-number

**Common Issues**:
- Code doesn't match pattern (`E[0-9]+[a-z]*`)
- Name is too short (< 2 characters)
- Origins array is empty

**Fix**: Check validation error details in toast message or console

---

### Service Client Not Bypassing RLS

**Cause**: Using wrong client type in API route

**Fix**: Use `createSupabaseServiceClient()`, NOT `createSupabaseServerClient()` for admin operations

---

## Quick Reference

### File Locations

```
app/admin/                         # Admin panel pages
  ├─ layout.tsx                    # Admin shell with nav
  ├─ page.tsx                      # Dashboard
  ├─ e-numbers/page.tsx            # E-numbers management
  ├─ dictionaries/page.tsx         # Dictionaries (tabs)
  ├─ synonyms/page.tsx             # Synonyms management
  ├─ settings/page.tsx             # App settings
  └─ audit/page.tsx                # Audit log viewer

app/api/admin/                     # Admin API routes
  ├─ e-numbers/route.ts            # E-numbers CRUD
  ├─ allergens/route.ts            # Allergens CRUD
  ├─ diets/route.ts                # Diets CRUD
  ├─ intolerances/route.ts         # Intolerances CRUD
  ├─ synonyms/route.ts             # Synonyms CRUD
  ├─ settings/route.ts             # Settings CRUD
  └─ audit/route.ts                # Audit log (read-only)

components/admin/                  # Admin UI components
  ├─ DataTable.tsx                 # Reusable table component
  ├─ AdminNav.tsx                  # Sidebar navigation
  ├─ ENumberDialog.tsx             # E-number create/edit form
  └─ ENumberDeleteDialog.tsx       # Delete confirmation

lib/admin/                         # Admin utilities
  ├─ api-client.ts                 # API wrapper functions
  └─ validation.ts                 # Zod schemas

middleware.ts                      # Route protection
scripts/create-admin.sql           # SQL script for admin creation
```

### SQL Commands

**Grant admin role**:
```sql
INSERT INTO user_roles (user_id, role_key)
VALUES ('[uuid]', 'owner');
```

**Check user roles**:
```sql
SELECT u.email, r.role_key
FROM user_roles r
JOIN auth.users u ON r.user_id = u.id
WHERE u.email = '[email]';
```

**View recent audit changes**:
```sql
SELECT *
FROM dictionary_changes
ORDER BY changed_at DESC
LIMIT 10;
```

---

**Last Updated**: 2025-01-22
**Maintained By**: Development Team
**Questions?**: Check troubleshooting section or create an issue.
