/**
 * ProfileSections - Individual card sections for profile view
 *
 * Each section displays specific user data in a clean, read-only format
 */

import { User, Utensils, AlertTriangle, AlertOctagon, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { SeverityChip } from "./SeverityChip";

// ==========================================
// Basic Info Card
// ==========================================

interface BasicInfoCardProps {
  displayName: string | null;
  pregnant: boolean;
  notes: string | null;
}

export function BasicInfoCard({ displayName, pregnant, notes }: BasicInfoCardProps) {
  return (
    <ProfileCard
      title="Información Básica"
      icon={<User className="w-5 h-5 text-primary" />}
    >
      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">
            Nombre
          </label>
          <p className="text-neutral-900">
            {displayName || <span className="text-neutral-400 italic">Sin nombre</span>}
          </p>
        </div>

        {/* Pregnancy Status */}
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">
            Estado
          </label>
          {pregnant ? (
            <Badge className="bg-info-soft text-info-dark border-info-light">
              Embarazada / En periodo de lactancia
            </Badge>
          ) : (
            <p className="text-neutral-600 text-sm">Sin estados especiales</p>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">
              Notas personales
            </label>
            <p className="text-neutral-600 text-sm whitespace-pre-wrap bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              {notes}
            </p>
          </div>
        )}
      </div>
    </ProfileCard>
  );
}

// ==========================================
// Diets Card
// ==========================================

interface DietsCardProps {
  diets: string[];
  dietNames: Map<string, string>;
}

export function DietsCard({ diets, dietNames }: DietsCardProps) {
  return (
    <ProfileCard
      title="Dietas"
      description={diets.length > 0 ? `${diets.length} dieta(s) activa(s)` : undefined}
      icon={<Utensils className="w-5 h-5 text-primary" />}
      isEmpty={diets.length === 0}
      emptyState={{
        message: "No tienes dietas configuradas",
      }}
    >
      <div className="flex flex-wrap gap-2">
        {diets.map((dietKey) => (
          <Badge
            key={dietKey}
            variant="secondary"
            className="bg-primary-soft text-primary border-primary/20 font-medium"
          >
            {dietNames.get(dietKey) || dietKey}
          </Badge>
        ))}
      </div>
    </ProfileCard>
  );
}

// ==========================================
// Allergens Card
// ==========================================

interface AllergenData {
  allergen_key: string;
  severity: number;
  notes: string | null;
}

interface AllergensCardProps {
  allergens: AllergenData[];
  allergenNames: Map<string, string>;
}

export function AllergensCard({ allergens, allergenNames }: AllergensCardProps) {
  return (
    <ProfileCard
      title="Alergias"
      description={
        allergens.length > 0 ? `${allergens.length} alergia(s) registrada(s)` : undefined
      }
      icon={<AlertTriangle className="w-5 h-5 text-danger" />}
      isEmpty={allergens.length === 0}
      emptyState={{
        message: "No tienes alergias registradas",
      }}
    >
      <div className="flex flex-wrap gap-3">
        {allergens.map(({ allergen_key, severity, notes }) => (
          <SeverityChip
            key={allergen_key}
            name={allergenNames.get(allergen_key) || allergen_key}
            severity={severity}
            notes={notes || undefined}
          />
        ))}
      </div>
    </ProfileCard>
  );
}

// ==========================================
// Intolerances Card
// ==========================================

interface IntoleranceData {
  intolerance_key: string;
  severity: number;
  notes: string | null;
}

interface IntolerancesCardProps {
  intolerances: IntoleranceData[];
  intoleranceNames: Map<string, string>;
}

export function IntolerancesCard({ intolerances, intoleranceNames }: IntolerancesCardProps) {
  return (
    <ProfileCard
      title="Intolerancias"
      description={
        intolerances.length > 0
          ? `${intolerances.length} intolerancia(s) registrada(s)`
          : undefined
      }
      icon={<AlertOctagon className="w-5 h-5 text-warning" />}
      isEmpty={intolerances.length === 0}
      emptyState={{
        message: "No tienes intolerancias registradas",
      }}
    >
      <div className="flex flex-wrap gap-3">
        {intolerances.map(({ intolerance_key, severity, notes }) => (
          <SeverityChip
            key={intolerance_key}
            name={intoleranceNames.get(intolerance_key) || intolerance_key}
            severity={severity}
            notes={notes || undefined}
          />
        ))}
      </div>
    </ProfileCard>
  );
}

// ==========================================
// Strictness Card
// ==========================================

interface StrictnessCardProps {
  strictnessName: string;
  onEditClick: () => void;
  blockTraces?: boolean;
  blockSameLine?: boolean;
  eNumbersUncertain?: string;
  pediatricMode?: boolean;
  anaphylaxisMode?: boolean;
  overridesCount?: number;
}

export function StrictnessCard({
  strictnessName,
  onEditClick,
  blockTraces = false,
  blockSameLine = false,
  eNumbersUncertain = "warn",
  pediatricMode = false,
  anaphylaxisMode = false,
  overridesCount = 0,
}: StrictnessCardProps) {
  return (
    <ProfileCard
      title="Configuración de Estrictitud"
      description={`Perfil activo: ${strictnessName}`}
      icon={<Settings className="w-5 h-5 text-primary" />}
    >
      <div className="space-y-4">
        <p className="text-neutral-600 text-sm">
          Tu perfil de estrictitud define cómo se evalúan las trazas, ingredientes
          inciertos y E-numbers en las etiquetas.
        </p>

        {/* Settings Summary */}
        <div className="flex flex-wrap gap-2">
          {blockTraces && (
            <Badge className="bg-danger-soft text-danger-dark border-danger-light">
              Trazas bloqueadas
            </Badge>
          )}
          {blockSameLine && (
            <Badge className="bg-warning-soft text-warning-dark border-warning-light">
              Misma línea bloqueada
            </Badge>
          )}
          {eNumbersUncertain === "block" && (
            <Badge className="bg-danger-soft text-danger-dark border-danger-light">
              E-numbers bloqueados
            </Badge>
          )}
          {eNumbersUncertain === "warn" && (
            <Badge className="bg-warning-soft text-warning-dark border-warning-light">
              E-numbers: advertir
            </Badge>
          )}
          {pediatricMode && (
            <Badge className="bg-info-soft text-info-dark border-info-light">
              Modo pediátrico
            </Badge>
          )}
          {anaphylaxisMode && (
            <Badge className="bg-danger-soft text-danger-dark border-danger-light">
              Modo anafilaxis
            </Badge>
          )}
        </div>

        {overridesCount > 0 && (
          <p className="text-sm text-neutral-600">
            {overridesCount} regla(s) personalizada(s) por alérgeno
          </p>
        )}

        <Button onClick={onEditClick} variant="outline" className="w-full sm:w-auto">
          <Settings className="w-4 h-4 mr-2" />
          Editar Estrictitud
        </Button>
      </div>
    </ProfileCard>
  );
}
