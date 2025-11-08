/**
 * ProfileSummary Component
 *
 * Displays user's allergen profile in scan sidebar:
 * - Allergens with severity
 * - Diets
 * - Intolerances
 * - Link to edit profile
 *
 * Design: Compact, color-coded, scannable
 */

"use client";

import Link from "next/link";
import { UserCircle2, AlertTriangle, Utensils, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import type { ProfilePayload } from "@/lib/risk/types";

export interface ProfileSummaryProps {
  profile: ProfilePayload | null;
  className?: string;
}

const severityLabels: Record<number, string> = {
  0: "Leve",
  1: "Moderado",
  2: "Severo",
  3: "Anafilaxis",
};

export function ProfileSummary({ profile, className }: ProfileSummaryProps) {
  if (!profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-primary" />
            Tu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600 mb-4">
            Completa tu perfil para análisis personalizados.
          </p>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="w-full">
              Configurar Perfil
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hasAllergens = profile.allergens.length > 0;
  const hasDiets = profile.diets.length > 0;
  const hasIntolerances = profile.intolerances.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-primary" />
            Tu Perfil
          </CardTitle>
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="text-xs">
              Editar
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Allergens */}
        {hasAllergens && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-danger" />
              Alérgenos ({profile.allergens.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.allergens.slice(0, 6).map((allergen, idx) => (
                <Badge
                  key={`${allergen.key}-${idx}`}
                  variant="destructive"
                  className="px-2 py-0.5 text-xs bg-danger text-white"
                  title={`Severidad: ${severityLabels[allergen.severity ?? 0]}`}
                >
                  {allergen.key} {allergen.severity >= 3 && "⚠️"}
                </Badge>
              ))}
              {profile.allergens.length > 6 && (
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs bg-neutral-50 border-neutral-300"
                >
                  +{profile.allergens.length - 6} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Diets */}
        {hasDiets && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1">
              <Utensils className="w-4 h-4 text-primary" />
              Dietas ({profile.diets.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.diets.slice(0, 4).map((diet, idx) => (
                <Badge
                  key={`${diet}-${idx}`}
                  variant="outline"
                  className="px-2 py-0.5 text-xs bg-primary-50 border-primary-200 text-primary-dark"
                >
                  {diet}
                </Badge>
              ))}
              {profile.diets.length > 4 && (
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs bg-neutral-50 border-neutral-300"
                >
                  +{profile.diets.length - 4} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Intolerances */}
        {hasIntolerances && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-1">
              <Heart className="w-4 h-4 text-warning" />
              Intolerancias ({profile.intolerances.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.intolerances.slice(0, 4).map((intolerance, idx) => (
                <Badge
                  key={`${intolerance.key}-${idx}`}
                  variant="outline"
                  className="px-2 py-0.5 text-xs bg-warning-50 border-warning-200 text-warning-dark"
                >
                  {intolerance.key}
                </Badge>
              ))}
              {profile.intolerances.length > 4 && (
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-xs bg-neutral-50 border-neutral-300"
                >
                  +{profile.intolerances.length - 4} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasAllergens && !hasDiets && !hasIntolerances && (
          <p className="text-sm text-neutral-600 text-center py-2">
            Sin restricciones configuradas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
