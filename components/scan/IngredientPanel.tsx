/**
 * IngredientPanel Component
 *
 * Interactive ingredient display with:
 * - Chip view (default) with color coding for matches
 * - Text view (copyable)
 * - Filter: All | Matched only | E-numbers only
 * - Copy button
 *
 * Design: Professional, useful for parents who need to share ingredient lists
 */

"use client";

import { useState } from "react";
import { Copy, Check, ListFilter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface IngredientChip {
  text: string;
  isMatch: boolean;
  confidence?: number;
}

export interface IngredientPanelProps {
  chips: IngredientChip[];
  asText: string;
  className?: string;
}

type ViewMode = "chips" | "text";
type FilterMode = "all" | "matched" | "enumbers";

export function IngredientPanel({
  chips,
  asText,
  className,
}: IngredientPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("chips");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(asText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Apply filter
  const filteredChips = chips.filter((chip) => {
    if (filterMode === "all") return true;
    if (filterMode === "matched") return chip.isMatch;
    if (filterMode === "enumbers") return /E\d{3,4}/i.test(chip.text);
    return true;
  });

  const matchCount = chips.filter((c) => c.isMatch).length;
  const eNumberCount = chips.filter((c) => /E\d{3,4}/i.test(c.text)).length;

  return (
    <Card className={cn("border-neutral-200 bg-white shadow-sm", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-neutral-900">
              Ingredientes
            </CardTitle>
            <CardDescription>
              {chips.length} ingredientes detectados
              {matchCount > 0 && ` • ${matchCount} coincide${matchCount > 1 ? "n" : ""} con tu perfil`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("chips")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "chips"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                )}
              >
                Chips
              </button>
              <button
                type="button"
                onClick={() => setViewMode("text")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "text"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                )}
              >
                Texto
              </button>
            </div>

            {/* Copy Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 pt-2">
          <ListFilter className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-600">Filtrar:</span>
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-auto h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({chips.length})</SelectItem>
              <SelectItem value="matched">Coincidencias ({matchCount})</SelectItem>
              <SelectItem value="enumbers">E-numbers ({eNumberCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "chips" ? (
          <div className="flex flex-wrap gap-2">
            {filteredChips.length > 0 ? (
              filteredChips.map((chip, idx) => (
                <Badge
                  key={`${chip.text}-${idx}`}
                  variant={chip.isMatch ? "destructive" : "outline"}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium",
                    chip.isMatch
                      ? "bg-danger text-white hover:bg-danger-600"
                      : "bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                  )}
                >
                  {chip.text}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-neutral-500 italic">
                No hay ingredientes que coincidan con el filtro.
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap font-mono">
              {asText || "No hay ingredientes disponibles."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
