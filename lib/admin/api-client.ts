/**
 * Admin API Client
 *
 * Helper functions for making admin API requests.
 * All requests use fetch with proper error handling.
 */

export class AdminAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "AdminAPIError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AdminAPIError(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// ============================================================================
// E-numbers API
// ============================================================================

export interface ENumber {
  code: string;
  name_es: string;
  likely_origins: string[];
  linked_allergen_keys: string[];
  residual_protein_risk: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchENumbers(): Promise<ENumber[]> {
  const response = await fetch("/api/admin/e-numbers");
  return handleResponse<ENumber[]>(response);
}

export async function createENumber(
  data: Omit<ENumber, "created_at" | "updated_at">
): Promise<ENumber> {
  const response = await fetch("/api/admin/e-numbers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ENumber>(response);
}

export async function updateENumber(
  code: string,
  data: Partial<Omit<ENumber, "code" | "created_at" | "updated_at">>
): Promise<ENumber> {
  const response = await fetch(`/api/admin/e-numbers/${code}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ENumber>(response);
}

export async function deleteENumber(code: string): Promise<void> {
  const response = await fetch(`/api/admin/e-numbers/${code}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

// ============================================================================
// Allergen Types API
// ============================================================================

export interface AllergenType {
  id: string;
  key: string;
  name_es: string;
  notes: string | null;
  synonyms: string[] | null;
}

export async function fetchAllergens(): Promise<AllergenType[]> {
  const response = await fetch("/api/admin/allergens");
  return handleResponse<AllergenType[]>(response);
}

export async function createAllergen(
  data: Omit<AllergenType, "id">
): Promise<AllergenType> {
  const response = await fetch("/api/admin/allergens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AllergenType>(response);
}

export async function updateAllergen(
  id: string,
  data: Partial<Omit<AllergenType, "id">>
): Promise<AllergenType> {
  const response = await fetch(`/api/admin/allergens/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AllergenType>(response);
}

export async function deleteAllergen(id: string): Promise<void> {
  const response = await fetch(`/api/admin/allergens/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

// ============================================================================
// Diet Types API
// ============================================================================

export interface DietType {
  id: string;
  key: string;
  name_es: string;
  description: string | null;
}

export async function fetchDiets(): Promise<DietType[]> {
  const response = await fetch("/api/admin/diets");
  return handleResponse<DietType[]>(response);
}

export async function createDiet(
  data: Omit<DietType, "id">
): Promise<DietType> {
  const response = await fetch("/api/admin/diets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<DietType>(response);
}

export async function updateDiet(
  id: string,
  data: Partial<Omit<DietType, "id">>
): Promise<DietType> {
  const response = await fetch(`/api/admin/diets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<DietType>(response);
}

export async function deleteDiet(id: string): Promise<void> {
  const response = await fetch(`/api/admin/diets/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

// ============================================================================
// Intolerance Types API
// ============================================================================

export interface IntoleranceType {
  id: string;
  key: string;
  name_es: string;
  notes: string | null;
  synonyms: string[] | null;
}

export async function fetchIntolerances(): Promise<IntoleranceType[]> {
  const response = await fetch("/api/admin/intolerances");
  return handleResponse<IntoleranceType[]>(response);
}

export async function createIntolerance(
  data: Omit<IntoleranceType, "id">
): Promise<IntoleranceType> {
  const response = await fetch("/api/admin/intolerances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<IntoleranceType>(response);
}

export async function updateIntolerance(
  id: string,
  data: Partial<Omit<IntoleranceType, "id">>
): Promise<IntoleranceType> {
  const response = await fetch(`/api/admin/intolerances/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<IntoleranceType>(response);
}

export async function deleteIntolerance(id: string): Promise<void> {
  const response = await fetch(`/api/admin/intolerances/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

// ============================================================================
// Allergen Synonyms API
// ============================================================================

export interface AllergenSynonym {
  id: string;
  allergen_id: string;
  surface: string;
  locale: string;
  weight: number;
  created_at: string;
}

export async function fetchSynonyms(
  allergenId?: string
): Promise<AllergenSynonym[]> {
  const url = allergenId
    ? `/api/admin/synonyms?allergen_id=${allergenId}`
    : "/api/admin/synonyms";
  const response = await fetch(url);
  return handleResponse<AllergenSynonym[]>(response);
}

export async function createSynonym(
  data: Omit<AllergenSynonym, "id" | "created_at">
): Promise<AllergenSynonym> {
  const response = await fetch("/api/admin/synonyms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AllergenSynonym>(response);
}

export async function updateSynonym(
  id: string,
  data: Partial<Omit<AllergenSynonym, "id" | "created_at">>
): Promise<AllergenSynonym> {
  const response = await fetch(`/api/admin/synonyms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AllergenSynonym>(response);
}

export async function deleteSynonym(id: string): Promise<void> {
  const response = await fetch(`/api/admin/synonyms/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(response);
}

// ============================================================================
// App Settings API
// ============================================================================

export interface AppSetting {
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export async function fetchSettings(): Promise<AppSetting[]> {
  const response = await fetch("/api/admin/settings");
  return handleResponse<AppSetting[]>(response);
}

export async function updateSetting(
  key: string,
  data: { value: any; description?: string }
): Promise<AppSetting> {
  const response = await fetch(`/api/admin/settings/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AppSetting>(response);
}

// ============================================================================
// Audit Log API
// ============================================================================

export interface AuditEntry {
  id: string;
  table_name: string;
  row_id: string | null;
  action: string;
  old_data: any;
  new_data: any;
  changed_by: string;
  changed_at: string;
}

export async function fetchAuditLog(filters?: {
  table_name?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (filters?.table_name) params.set("table_name", filters.table_name);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.offset) params.set("offset", filters.offset.toString());

  const url = `/api/admin/audit?${params.toString()}`;
  const response = await fetch(url);
  return handleResponse<AuditEntry[]>(response);
}
