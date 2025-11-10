"use client";

import * as React from "react";
import { Plus, Filter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/admin/DataTable";
import { SynonymDialog } from "@/components/admin/SynonymDialog";
import { DictionaryDeleteDialog } from "@/components/admin/DictionaryDeleteDialog";
import type { DataTableColumn, DataTableAction } from "@/components/admin/DataTable";
import {
  fetchSynonyms,
  fetchAllergens,
  deleteSynonym,
  type AllergenType,
} from "@/lib/admin/api-client";

interface SynonymWithAllergen {
  id: string;
  allergen_id: string;
  surface: string;
  locale: string;
  weight: number;
  created_at: string;
  allergen_types?: {
    id: string;
    key: string;
    name_es: string;
  };
}

export default function SynonymsPage() {
  const [synonyms, setSynonyms] = React.useState<SynonymWithAllergen[]>([]);
  const [allergens, setAllergens] = React.useState<AllergenType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedAllergenId, setSelectedAllergenId] = React.useState<string>("all");
  const [editingSynonym, setEditingSynonym] = React.useState<SynonymWithAllergen | null>(null);
  const [deletingSynonym, setDeletingSynonym] = React.useState<SynonymWithAllergen | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Load allergens on mount
  React.useEffect(() => {
    loadAllergens();
  }, []);

  // Load synonyms when allergen filter changes
  React.useEffect(() => {
    loadSynonyms();
  }, [selectedAllergenId]);

  async function loadAllergens() {
    try {
      const data = await fetchAllergens();
      setAllergens(data);
    } catch (error: any) {
      console.error("Error loading allergens:", error);
      toast.error("Failed to load allergens");
    }
  }

  async function loadSynonyms() {
    try {
      setIsLoading(true);
      const allergenFilter = selectedAllergenId === "all" ? undefined : selectedAllergenId;
      const data = await fetchSynonyms(allergenFilter);
      setSynonyms(data);
    } catch (error: any) {
      console.error("Error loading synonyms:", error);
      toast.error("Failed to load synonyms");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreate() {
    setEditingSynonym(null);
    setIsCreateDialogOpen(true);
  }

  function handleEdit(synonym: SynonymWithAllergen) {
    setEditingSynonym(synonym);
  }

  function handleDelete(synonym: SynonymWithAllergen) {
    setDeletingSynonym(synonym);
  }

  async function confirmDelete() {
    if (!deletingSynonym) return;

    try {
      await deleteSynonym(deletingSynonym.id);
      toast.success(`Synonym "${deletingSynonym.surface}" deleted successfully`);
      setDeletingSynonym(null);
      loadSynonyms();
    } catch (error: any) {
      console.error("Error deleting synonym:", error);
      toast.error(error.message || "Failed to delete synonym");
    }
  }

  const columns: DataTableColumn<SynonymWithAllergen>[] = [
    {
      key: "surface",
      label: "Surface (Synonym)",
      render: (row) => <span className="font-medium">{row.surface}</span>,
    },
    {
      key: "allergen",
      label: "Allergen",
      render: (row) => {
        if (!row.allergen_types) {
          return <span className="text-muted-foreground text-sm">Unknown</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.allergen_types.name_es}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {row.allergen_types.key}
            </span>
          </div>
        );
      },
    },
    {
      key: "locale",
      label: "Locale",
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.locale}
        </Badge>
      ),
    },
    {
      key: "weight",
      label: "Weight",
      render: (row) => {
        const variant =
          row.weight === 3
            ? "default"
            : row.weight === 2
              ? "secondary"
              : "outline";
        return (
          <Badge variant={variant} className="text-xs">
            {row.weight}
          </Badge>
        );
      },
    },
  ];

  const actions: DataTableAction<SynonymWithAllergen>[] = [
    {
      label: "Edit",
      variant: "ghost",
      onClick: handleEdit,
    },
    {
      label: "Delete",
      variant: "destructive",
      onClick: handleDelete,
    },
  ];

  const filteredSynonyms =
    selectedAllergenId === "all"
      ? synonyms
      : synonyms.filter((s) => s.allergen_id === selectedAllergenId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Allergen Synonyms</h1>
          <p className="text-muted-foreground mt-2">
            Manage alternative names for allergen matching with trigram search
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Synonym
        </Button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium">Filter by allergen:</span>
          <Select value={selectedAllergenId} onValueChange={setSelectedAllergenId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Allergens</SelectItem>
              {allergens.map((allergen) => (
                <SelectItem key={allergen.id} value={allergen.id}>
                  {allergen.name_es} ({allergen.key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary">{filteredSynonyms.length} synonyms</Badge>
      </div>

      <DataTable
        data={filteredSynonyms}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search synonyms by surface or allergen..."
        searchFn={(synonym, query) => {
          const q = query.toLowerCase();
          return (
            synonym.surface.toLowerCase().includes(q) ||
            (synonym.allergen_types?.name_es || "").toLowerCase().includes(q) ||
            (synonym.allergen_types?.key || "").toLowerCase().includes(q)
          );
        }}
        isLoading={isLoading}
        emptyMessage={
          selectedAllergenId === "all"
            ? "No synonyms found. Add your first synonym to get started."
            : "No synonyms found for the selected allergen."
        }
        getRowKey={(row) => row.id}
      />

      <SynonymDialog
        open={isCreateDialogOpen || !!editingSynonym}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingSynonym(null);
          }
        }}
        synonym={editingSynonym || undefined}
        allergens={allergens}
        onSuccess={loadSynonyms}
      />

      {deletingSynonym && (
        <DictionaryDeleteDialog
          open={!!deletingSynonym}
          onOpenChange={(open) => !open && setDeletingSynonym(null)}
          itemType="allergen"
          itemName={deletingSynonym.surface}
          itemKey={deletingSynonym.allergen_types?.key || "unknown"}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
