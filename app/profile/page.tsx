"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { Session } from "@supabase/supabase-js";

import { useSupabase } from "@/components/SupabaseProvider";
import type { Database } from "@/lib/supabase/types";

type DietType = Database["public"]["Tables"]["diet_types"]["Row"];
type AllergenType = Database["public"]["Tables"]["allergen_types"]["Row"];
type IntoleranceType = Database["public"]["Tables"]["intolerance_types"]["Row"];
type StrictnessProfile = Database["public"]["Tables"]["strictness_profiles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

type AllergenSelection = {
  selected: boolean;
  severity: number;
  notes: string;
};

type IntoleranceSelection = {
  selected: boolean;
  severity: number;
  notes: string;
};

type OverrideBoolean = boolean | "inherit";

type OverrideState = {
  enabled: boolean;
  block_traces: OverrideBoolean;
  block_same_line: OverrideBoolean;
  e_numbers_uncertain: "inherit" | "allow" | "warn" | "block";
  residual_protein_ppm: string;
  notes: string;
};

type StrictnessState = {
  id: string | null;
  name: string;
  block_traces: boolean;
  block_same_line: boolean;
  e_numbers_uncertain: "allow" | "warn" | "block";
  min_model_confidence: number;
  pediatric_mode: boolean;
  anaphylaxis_mode: boolean;
  residual_protein_ppm_default: number;
};

type ProfilePayload = {
  user_id: string;
  profile: Omit<ProfileRow, "active_strictness_id"> | null;
  diets: string[];
  allergens: { key: string; severity: number }[];
  intolerances: { key: string; severity: number }[];
  strictness: Pick<
    StrictnessProfile,
    | "id"
    | "name"
    | "block_traces"
    | "block_same_line"
    | "e_numbers_uncertain"
    | "min_model_confidence"
    | "pediatric_mode"
    | "anaphylaxis_mode"
    | "residual_protein_ppm_default"
  > | null;
  overrides: Record<
    string,
    {
      block_traces?: boolean;
      block_same_line?: boolean;
      e_numbers_uncertain?: "allow" | "warn" | "block";
      residual_protein_ppm?: number;
      notes?: string;
    }
  >;
};

const steps = [
  { key: "profile", title: "Perfil" },
  { key: "diets", title: "Dietas" },
  { key: "allergens", title: "Alergias" },
  { key: "intolerances", title: "Intolerancias" },
  { key: "strictness", title: "Estrictitud" },
] as const;

const defaultStrictness: StrictnessState = {
  id: null,
  name: "Diario",
  block_traces: false,
  block_same_line: false,
  e_numbers_uncertain: "warn",
  min_model_confidence: 0.7,
  pediatric_mode: false,
  anaphylaxis_mode: false,
  residual_protein_ppm_default: 20,
};

function toRecord<T extends { key: string }>(items: T[]) {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.key] = item;
    return acc;
  }, {});
}

function createEmptyOverride(): OverrideState {
  return {
    enabled: false,
    block_traces: "inherit",
    block_same_line: "inherit",
    e_numbers_uncertain: "inherit",
    residual_protein_ppm: "",
    notes: "",
  };
}

function booleanToOverride(value: boolean | null | undefined): OverrideBoolean {
  return typeof value === "boolean" ? value : "inherit";
}

function overrideToBoolean(value: OverrideBoolean): boolean | null {
  return value === "inherit" ? null : value;
}

function hasOverrideValues(state: OverrideState): boolean {
  if (!state.enabled) return false;
  return (
    state.block_traces !== "inherit" ||
    state.block_same_line !== "inherit" ||
    state.e_numbers_uncertain !== "inherit" ||
    state.residual_protein_ppm.trim() !== "" ||
    state.notes.trim() !== ""
  );
}

export default function ProfilePage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [dietTypes, setDietTypes] = useState<DietType[]>([]);
  const [allergenTypes, setAllergenTypes] = useState<AllergenType[]>([]);
  const [intoleranceTypes, setIntoleranceTypes] = useState<IntoleranceType[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [pregnant, setPregnant] = useState(false);
  const [profileNotes, setProfileNotes] = useState("");

  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<Record<string, AllergenSelection>>({});
  const [intolerances, setIntolerances] = useState<Record<string, IntoleranceSelection>>({});
  const [strictness, setStrictness] = useState<StrictnessState>(defaultStrictness);
  const [overrides, setOverrides] = useState<Record<string, OverrideState>>({});

  const [currentStep, setCurrentStep] = useState<(typeof steps)[number]["key"]>("profile");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allergenMap = useMemo(() => toRecord(allergenTypes), [allergenTypes]);
  const intoleranceMap = useMemo(() => toRecord(intoleranceTypes), [intoleranceTypes]);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setAuthChecked(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const ensureProfile = useCallback(
    async (activeSession: Session) => {
      const defaultDisplayName =
        activeSession.user.user_metadata?.full_name ??
        activeSession.user.email?.split("@")[0] ??
        "Perfil";

      const { error: upsertError } = await supabase.from("user_profiles").upsert(
        {
          user_id: activeSession.user.id,
          display_name: displayName || defaultDisplayName,
        },
        { onConflict: "user_id" },
      );

      if (upsertError) throw upsertError;

      // Para MVP: todo usuario autenticado es "owner" del workspace.
      const { error: roleSeedError } = await supabase.from("app_roles").upsert({ key: "owner" });
      if (roleSeedError) {
        console.warn("No se pudo registrar app_roles.owner:", roleSeedError.message);
      }

      const { error: assignRoleError } = await supabase.from("user_roles").upsert(
        {
          user_id: activeSession.user.id,
          role_key: "owner",
        },
        { onConflict: "user_id,role_key" },
      );
      if (assignRoleError) {
        console.warn("No se pudo asignar rol owner al usuario:", assignRoleError.message);
      }
    },
    [displayName, supabase],
  );

  const profileFetcher = useCallback(async () => {
    if (!session) return null;

    await ensureProfile(session);

    const [dietRes, allergenRes, intoleranceRes, profileRes] = await Promise.all([
      supabase.from("diet_types").select("*").order("name_es"),
      supabase.from("allergen_types").select("*").order("name_es"),
      supabase.from("intolerance_types").select("*").order("name_es"),
      fetch("/api/profile", { cache: "no-store" }).then(async (res) => {
        if (res.status === 401) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<{ profile: ProfilePayload }>;
      }),
    ]);

    if (dietRes.error) throw dietRes.error;
    if (allergenRes.error) throw allergenRes.error;
    if (intoleranceRes.error) throw intoleranceRes.error;

    return {
      dietTypes: dietRes.data ?? [],
      allergenTypes: allergenRes.data ?? [],
      intoleranceTypes: intoleranceRes.data ?? [],
      payload: profileRes.profile,
    };
  }, [ensureProfile, session, supabase]);

  const { data: profileData, error: swrError, mutate } = useSWR(
    session ? ["profile", session.user.id] : null,
    profileFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  useEffect(() => {
    if (!profileData) return;

    setDietTypes(profileData.dietTypes);
    setAllergenTypes(profileData.allergenTypes);
    setIntoleranceTypes(profileData.intoleranceTypes);

    const payload = profileData.payload;
    const profileInfo = payload.profile;

    if (profileInfo) {
      setDisplayName(profileInfo.display_name ?? "");
      setPregnant(profileInfo.pregnant ?? false);
      setProfileNotes(profileInfo.notes ?? "");
    }

    setSelectedDiets(payload.diets ?? []);

    setAllergens(
      payload.allergens.reduce<Record<string, AllergenSelection>>((acc, item) => {
        acc[item.key] = {
          selected: true,
          severity: item.severity ?? 2,
          notes: "",
        };
        return acc;
      }, {}),
    );

    setIntolerances(
      payload.intolerances.reduce<Record<string, IntoleranceSelection>>((acc, item) => {
        acc[item.key] = {
          selected: true,
          severity: item.severity ?? 1,
          notes: "",
        };
        return acc;
      }, {}),
    );

    setStrictness((prev) => ({
      ...prev,
      ...(payload.strictness
        ? {
            id: payload.strictness.id,
            name: payload.strictness.name,
            block_traces: payload.strictness.block_traces,
            block_same_line: payload.strictness.block_same_line,
            e_numbers_uncertain: payload.strictness.e_numbers_uncertain,
            min_model_confidence: payload.strictness.min_model_confidence,
            pediatric_mode: payload.strictness.pediatric_mode,
            anaphylaxis_mode: payload.strictness.anaphylaxis_mode,
            residual_protein_ppm_default: payload.strictness.residual_protein_ppm_default,
          }
        : defaultStrictness),
    }));

    const selectedKeys = new Set(payload.allergens.map((item) => item.key));
    const overridePayload = payload.overrides ?? {};
    const overrideKeys = new Set([...selectedKeys, ...Object.keys(overridePayload)]);

    const overrideState: Record<string, OverrideState> = {};
    overrideKeys.forEach((key) => {
      const data = overridePayload[key];
      const state = createEmptyOverride();
      if (data) {
        state.block_traces = booleanToOverride(data.block_traces);
        state.block_same_line = booleanToOverride(data.block_same_line);
        state.e_numbers_uncertain =
          data.e_numbers_uncertain === "allow" ||
          data.e_numbers_uncertain === "warn" ||
          data.e_numbers_uncertain === "block"
            ? data.e_numbers_uncertain
            : "inherit";
        state.residual_protein_ppm =
          typeof data.residual_protein_ppm === "number"
            ? String(data.residual_protein_ppm)
            : "";
        state.notes = data.notes ?? "";
        const hasAny =
          typeof data.block_traces === "boolean" ||
          typeof data.block_same_line === "boolean" ||
          (typeof data.e_numbers_uncertain === "string" && data.e_numbers_uncertain.length > 0) ||
          typeof data.residual_protein_ppm === "number" ||
          (typeof data.notes === "string" && data.notes.trim().length > 0);
        state.enabled = hasAny;
      }
      overrideState[key] = state;
    });
    setOverrides(overrideState);
  }, [profileData]);

  useEffect(() => {
    if (swrError) {
      console.error(swrError);
      setError(swrError instanceof Error ? swrError.message : "No pudimos cargar tu perfil.");
    }
  }, [swrError]);

  useEffect(() => {
    if (!session) {
      setDietTypes([]);
      setAllergenTypes([]);
      setIntoleranceTypes([]);
    }
  }, [session]);

  const loading = !profileData && !swrError && !!session;

  const handleToggleDiet = (key: string) => {
    setSelectedDiets((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleToggleAllergen = (key: string) => {
    const current = allergens[key];
    const nextSelected = !(current?.selected ?? false);
    const severity = current?.severity ?? 2;
    const notes = current?.notes ?? "";

    setAllergens((prev) => ({
      ...prev,
      [key]: { selected: nextSelected, severity, notes },
    }));
    setOverrides((prev) => {
      const existing = prev[key] ?? createEmptyOverride();
      const updated = nextSelected ? existing : { ...existing, enabled: false };
      return { ...prev, [key]: updated };
    });
  };
  const updateOverride = useCallback(
    (
      key: string,
      partial:
        | Partial<OverrideState>
        | ((current: OverrideState) => OverrideState),
    ) => {
      setOverrides((prev) => {
        const current = prev[key] ?? createEmptyOverride();
        const next =
          typeof partial === "function" ? partial(current) : { ...current, ...partial };
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const handleToggleIntolerance = (key: string) => {
    setIntolerances((prev) => {
      const current = prev[key];
      if (current) {
        return {
          ...prev,
          [key]: { ...current, selected: !current.selected },
        };
      }
      return {
        ...prev,
        [key]: { selected: true, severity: 1, notes: "" },
      };
    });
  };

  const saveDiets = useCallback(
    async (userId: string) => {
      const selectedRows = dietTypes.filter((diet) => selectedDiets.includes(diet.key));

      const { error: deleteError } = await supabase
        .from("user_profile_diets")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      if (selectedRows.length === 0) return;

      const { error: insertError } = await supabase.from("user_profile_diets").insert(
        selectedRows.map((diet) => ({
          user_id: userId,
          diet_id: diet.id,
        })),
      );

      if (insertError) throw insertError;
    },
    [dietTypes, selectedDiets, supabase],
  );

  const saveAllergens = useCallback(
    async (userId: string) => {
      const selectedEntries = Object.entries(allergens).filter(([, value]) => value.selected);

      const { error: deleteError } = await supabase
        .from("user_profile_allergens")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      if (selectedEntries.length === 0) return;

      const rows = selectedEntries
        .map(([key, value]) => {
          const allergen = allergenMap[key];
          if (!allergen) return null;
          return {
            user_id: userId,
            allergen_id: allergen.id,
            severity: Math.max(0, Math.min(3, value.severity)),
            notes: value.notes || null,
          };
        })
        .filter(Boolean) as Database["public"]["Tables"]["user_profile_allergens"]["Insert"][];

      if (rows.length === 0) return;

      const { error: insertError } = await supabase.from("user_profile_allergens").insert(rows);

      if (insertError) throw insertError;
    },
    [allergens, allergenMap, supabase],
  );

  const saveIntolerances = useCallback(
    async (userId: string) => {
      const selectedEntries = Object.entries(intolerances).filter(([, value]) => value.selected);

      const { error: deleteError } = await supabase
        .from("user_profile_intolerances")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      if (selectedEntries.length === 0) return;

      const rows = selectedEntries
        .map(([key, value]) => {
          const intolerance = intoleranceMap[key];
          if (!intolerance) return null;
          return {
            user_id: userId,
            intolerance_id: intolerance.id,
            severity: Math.max(0, Math.min(3, value.severity)),
            notes: value.notes || null,
          };
        })
        .filter(Boolean) as Database["public"]["Tables"]["user_profile_intolerances"]["Insert"][];

      if (rows.length === 0) return;

      const { error: insertError } = await supabase.from("user_profile_intolerances").insert(rows);

      if (insertError) throw insertError;
    },
    [intolerances, intoleranceMap, supabase],
  );

  const saveProfile = useCallback(
    async (userId: string) => {
      const trimmedNotes = profileNotes.trim();

      const { error: upsertError } = await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          display_name: displayName || null,
          pregnant,
          notes: trimmedNotes.length > 0 ? trimmedNotes : null,
        },
        { onConflict: "user_id" },
      );

      if (upsertError) throw upsertError;
    },
    [displayName, pregnant, profileNotes, supabase],
  );

  const saveStrictness = useCallback(
    async (userId: string) => {
      if (!strictness.id) return;

      const { error: updateError } = await supabase
        .from("strictness_profiles")
        .update({
          block_traces: strictness.block_traces,
          block_same_line: strictness.block_same_line,
          e_numbers_uncertain: strictness.e_numbers_uncertain,
          min_model_confidence: strictness.min_model_confidence,
          pediatric_mode: strictness.pediatric_mode,
          anaphylaxis_mode: strictness.anaphylaxis_mode,
          residual_protein_ppm_default: strictness.residual_protein_ppm_default,
        })
        .eq("id", strictness.id)
        .eq("user_id", userId);

      if (updateError) throw updateError;
    },
    [strictness, supabase],
  );

  const saveOverrides = useCallback(async () => {
      if (!strictness.id) return;

      const { error: deleteError } = await supabase
        .from("strictness_overrides")
        .delete()
        .eq("strictness_id", strictness.id);

      if (deleteError) throw deleteError;

      const rows = Object.entries(overrides)
        .map(([key, state]) => {
          const selection = allergens[key];
          if (!selection?.selected) return null;
          if (!hasOverrideValues(state)) return null;

          const allergen = allergenMap[key];
          if (!allergen) return null;

          const residualInput = state.residual_protein_ppm.trim();
          const parsedResidual =
            residualInput.length > 0 ? Number.parseInt(residualInput, 10) : null;
          const residual = parsedResidual !== null && Number.isNaN(parsedResidual) ? null : parsedResidual;

          return {
            strictness_id: strictness.id,
            allergen_id: allergen.id,
            block_traces: overrideToBoolean(state.block_traces),
            block_same_line: overrideToBoolean(state.block_same_line),
            e_numbers_uncertain:
              state.e_numbers_uncertain === "inherit" ? null : state.e_numbers_uncertain,
            residual_protein_ppm: residual,
            notes: state.notes.trim() !== "" ? state.notes.trim() : null,
          };
        })
        .filter(Boolean) as Database["public"]["Tables"]["strictness_overrides"]["Insert"][];

      if (rows.length === 0) return;

      const { error: insertError } = await supabase.from("strictness_overrides").insert(rows);
      if (insertError) throw insertError;
    }, [allergens, allergenMap, overrides, strictness.id, supabase]);

  const handleSave = async () => {
    if (!session) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await saveProfile(session.user.id);
      await saveDiets(session.user.id);
      await saveAllergens(session.user.id);
      await saveIntolerances(session.user.id);
      await saveStrictness(session.user.id);
      await saveOverrides();

      setMessage("Perfil guardado correctamente.");
      await mutate();
    } catch (cause) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };


  const handleSignOut = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setMessage("Sesión cerrada.");
    } catch (cause) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "No pudimos cerrar sesión.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "profile":
        return (
          <div className="card">
            <h2>Información básica</h2>
            <label className="field">
              <span>Nombre para mostrar</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Ej. Familia Lagos"
                autoComplete="name"
              />
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={pregnant}
                onChange={(event) => setPregnant(event.target.checked)}
              />
              <span>Gestación en curso</span>
            </label>

            <label className="field">
              <span>Notas generales</span>
              <textarea
                value={profileNotes}
                onChange={(event) => setProfileNotes(event.target.value)}
                rows={4}
                placeholder="Información adicional que quieras recordar (médico tratante, protocolos, etc.)"
              />
            </label>
          </div>
        );
      case "diets":
        return (
          <div className="card">
            <h2>Dietas o pautas alimentarias</h2>
            <p className="helper">
              Selecciona las dietas que aplican al perfil. Estas se usan para filtros adicionales en
              el análisis.
            </p>
            <div className="grid">
              {dietTypes.map((diet) => (
                <label className="chip-option" key={diet.id}>
                  <input
                    type="checkbox"
                    checked={selectedDiets.includes(diet.key)}
                    onChange={() => handleToggleDiet(diet.key)}
                  />
                  <span>
                    <strong>{diet.name_es}</strong>
                    {diet.description ? <small>{diet.description}</small> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      case "allergens":
        return (
          <div className="card">
            <h2>Alergias</h2>
            <p className="helper">
              Marca los alérgenos relevantes y ajusta la severidad. Usa notas para registrar
              indicaciones específicas del especialista.
            </p>
            <div className="grid">
              {allergenTypes.map((allergen) => {
                const selection = allergens[allergen.key];
                const active = selection?.selected ?? false;
                const override = overrides[allergen.key] ?? createEmptyOverride();
                return (
                  <div
                    key={allergen.id}
                    className={`allergen-row ${active ? "active" : ""}`}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).tagName !== "INPUT" && !saving) {
                        handleToggleAllergen(allergen.key);
                      }
                    }}
                  >
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleToggleAllergen(allergen.key)}
                      />
                      <span>{allergen.name_es}</span>
                    </label>
                    {active ? (
                      <div className="allergen-controls">
                        <label>
                          Severidad:
                          <input
                            type="range"
                            min={0}
                            max={3}
                            step={1}
                            value={selection?.severity ?? 2}
                            onChange={(event) =>
                              setAllergens((prev) => ({
                                ...prev,
                                [allergen.key]: {
                                  selected: true,
                                  severity: Number(event.target.value),
                                  notes: selection?.notes ?? "",
                                },
                              }))
                            }
                          />
                          <span className="pill">
                            {["Baja", "Media", "Alta", "Anafilaxia"][selection?.severity ?? 2]}
                          </span>
                        </label>
                        <label>
                          Notas:
                          <input
                            type="text"
                            value={selection?.notes ?? ""}
                            placeholder="Ej. evitar trazas"
                            onChange={(event) =>
                              setAllergens((prev) => ({
                                ...prev,
                                [allergen.key]: {
                                  selected: true,
                                  severity: selection?.severity ?? 2,
                                  notes: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                        <div
                          className="override-section"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              checked={override.enabled}
                              onChange={(event) =>
                                updateOverride(allergen.key, { enabled: event.target.checked })
                              }
                            />
                            <span>Personalizar reglas para este alérgeno</span>
                          </label>
                          {override.enabled ? (
                            <div className="override-controls">
                              <label className="field">
                                <span>Bloqueo de trazas</span>
                                <select
                                  value={
                                    override.block_traces === "inherit"
                                      ? "inherit"
                                      : override.block_traces
                                        ? "true"
                                        : "false"
                                  }
                                  onChange={(event) => {
                                    const value = event.target.value as "inherit" | "true" | "false";
                                    updateOverride(allergen.key, {
                                      block_traces:
                                        value === "inherit" ? "inherit" : value === "true",
                                      enabled: true,
                                    });
                                  }}
                                >
                                  <option value="inherit">Heredar del perfil</option>
                                  <option value="true">Forzar bloqueo</option>
                                  <option value="false">Permitir</option>
                                </select>
                              </label>
                              <label className="field">
                                <span>Misma línea de producción</span>
                                <select
                                  value={
                                    override.block_same_line === "inherit"
                                      ? "inherit"
                                      : override.block_same_line
                                        ? "true"
                                        : "false"
                                  }
                                  onChange={(event) => {
                                    const value = event.target.value as "inherit" | "true" | "false";
                                    updateOverride(allergen.key, {
                                      block_same_line:
                                        value === "inherit" ? "inherit" : value === "true",
                                      enabled: true,
                                    });
                                  }}
                                >
                                  <option value="inherit">Heredar del perfil</option>
                                  <option value="true">Forzar bloqueo</option>
                                  <option value="false">Permitir</option>
                                </select>
                              </label>
                              <label className="field">
                                <span>E-números inciertos</span>
                                <select
                                  value={override.e_numbers_uncertain}
                                  onChange={(event) =>
                                    updateOverride(allergen.key, {
                                      e_numbers_uncertain: event.target
                                        .value as OverrideState["e_numbers_uncertain"],
                                      enabled: true,
                                    })
                                  }
                                >
                                  <option value="inherit">Heredar del perfil</option>
                                  <option value="allow">Permitir</option>
                                  <option value="warn">Advertir</option>
                                  <option value="block">Bloquear</option>
                                </select>
                              </label>
                              <label className="field">
                                <span>Umbral residual (ppm)</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={override.residual_protein_ppm}
                                  placeholder="Ej. 10"
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    if (/^\d*$/.test(value)) {
                                      updateOverride(allergen.key, {
                                        residual_protein_ppm: value,
                                        enabled: true,
                                      });
                                    }
                                  }}
                                />
                              </label>
                              <label className="field">
                                <span>Notas específicas</span>
                                <textarea
                                  rows={2}
                                  value={override.notes}
                                  placeholder="Advertencias o recordatorios para este alérgeno."
                                  onChange={(event) =>
                                    updateOverride(allergen.key, {
                                      notes: event.target.value,
                                      enabled: true,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "intolerances":
        return (
          <div className="card">
            <h2>Intolerancias</h2>
            <p className="helper">
              Ajusta según la tolerancia personal. Usa severidad 0 si solo deseas registrar la
              intolerancia sin restricciones fuertes.
            </p>
            <div className="grid">
              {intoleranceTypes.map((intolerance) => {
                const selection = intolerances[intolerance.key];
                const active = selection?.selected ?? false;
                return (
                  <div
                    key={intolerance.id}
                    className={`allergen-row ${active ? "active" : ""}`}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).tagName !== "INPUT" && !saving) {
                        handleToggleIntolerance(intolerance.key);
                      }
                    }}
                  >
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleToggleIntolerance(intolerance.key)}
                      />
                      <span>{intolerance.name_es}</span>
                    </label>
                    {active ? (
                      <div className="allergen-controls">
                        <label>
                          Severidad:
                          <input
                            type="range"
                            min={0}
                            max={3}
                            step={1}
                            value={selection?.severity ?? 1}
                            onChange={(event) =>
                              setIntolerances((prev) => ({
                                ...prev,
                                [intolerance.key]: {
                                  selected: true,
                                  severity: Number(event.target.value),
                                  notes: selection?.notes ?? "",
                                },
                              }))
                            }
                          />
                          <span className="pill">
                            {["Baja", "Moderada", "Alta", "Crítica"][selection?.severity ?? 1]}
                          </span>
                        </label>
                        <label>
                          Notas:
                          <input
                            type="text"
                            value={selection?.notes ?? ""}
                            placeholder="Observaciones"
                            onChange={(event) =>
                              setIntolerances((prev) => ({
                                ...prev,
                                [intolerance.key]: {
                                  selected: true,
                                  severity: selection?.severity ?? 1,
                                  notes: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "strictness":
        return (
          <div className="card">
            <h2>Perfil de estrictitud</h2>
            <p className="helper">
              Controla cómo se evalúan trazas, líneas compartidas y códigos E en el análisis.
            </p>
            <div className="strictness-grid">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={strictness.block_traces}
                  onChange={(event) =>
                    setStrictness((prev) => ({ ...prev, block_traces: event.target.checked }))
                  }
                />
                <span>Bloquear productos con “puede contener/trazas”.</span>
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={strictness.block_same_line}
                  onChange={(event) =>
                    setStrictness((prev) => ({ ...prev, block_same_line: event.target.checked }))
                  }
                />
                <span>Bloquear si se produce en la misma línea.</span>
              </label>

              <label className="field">
                <span>E-números con origen incierto</span>
                <select
                  value={strictness.e_numbers_uncertain}
                  onChange={(event) =>
                    setStrictness((prev) => ({
                      ...prev,
                      e_numbers_uncertain: event.target.value as StrictnessState["e_numbers_uncertain"],
                    }))
                  }
                >
                  <option value="allow">Permitir (solo aviso)</option>
                  <option value="warn">Advertir</option>
                  <option value="block">Bloquear</option>
                </select>
              </label>

              <label className="field">
                <span>Confianza mínima del modelo</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={strictness.min_model_confidence}
                  onChange={(event) =>
                    setStrictness((prev) => ({
                      ...prev,
                      min_model_confidence: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>Umbral proteína residual (ppm)</span>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={1}
                  value={strictness.residual_protein_ppm_default}
                  onChange={(event) =>
                    setStrictness((prev) => ({
                      ...prev,
                      residual_protein_ppm_default: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={strictness.pediatric_mode}
                  onChange={(event) =>
                    setStrictness((prev) => ({ ...prev, pediatric_mode: event.target.checked }))
                  }
                />
                <span>Modo pediátrico (aplica reglas más estrictas).</span>
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={strictness.anaphylaxis_mode}
                  onChange={(event) =>
                    setStrictness((prev) => ({ ...prev, anaphylaxis_mode: event.target.checked }))
                  }
                />
                <span>Modo anafilaxia (eleva riesgos ante trazas).</span>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Middleware protects this route - users must be authenticated
  if (!authChecked || !session) {
    return (
      <main className="profile-page">
        <h1>Perfil alérgico</h1>
        <p>Cargando…</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <h1>Perfil alérgico</h1>
          <p className="helper">
            Configura dietas, alergias, intolerancias y el perfil de estrictitud que usa el motor de
            riesgo.
          </p>
        </div>
        <div className="header-actions">
          <Link href="/scan">
            <button type="button" className="secondary">
              ← Volver al Escáner
            </button>
          </Link>
          <button type="button" onClick={handleSignOut} disabled={saving}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="wizard-steps">
        {steps.map((step) => (
          <button
            key={step.key}
            type="button"
            className={step.key === currentStep ? "active" : ""}
            onClick={() => setCurrentStep(step.key)}
          >
            {step.title}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="card">
          <p>Cargando datos desde Supabase…</p>
        </div>
      ) : (
        renderStep()
      )}

      <footer className="wizard-footer">
        <div className="status">
          {error ? <span className="error">{error}</span> : null}
          {message ? <span className="success">{message}</span> : null}
        </div>
        <div className="actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="primary"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </footer>
    </main>
  );
}
