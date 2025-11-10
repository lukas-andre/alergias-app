"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/admin/DataTable";
import { AllergenDialog } from "@/components/admin/AllergenDialog";
import { DietDialog } from "@/components/admin/DietDialog";
import { IntoleranceDialog } from "@/components/admin/IntoleranceDialog";
import { DictionaryDeleteDialog } from "@/components/admin/DictionaryDeleteDialog";
import type { DataTableColumn, DataTableAction } from "@/components/admin/DataTable";
import {
  fetchAllergens,
  fetchDiets,
  fetchIntolerances,
  deleteAllergen,
  deleteDiet,
  deleteIntolerance,
  type AllergenType,
  type DietType,
  type IntoleranceType,
} from "@/lib/admin/api-client";

export default function DictionariesPage() {
  const [activeTab, setActiveTab] = React.useState("allergens");

  // Allergens state
  const [allergens, setAllergens] = React.useState<AllergenType[]>([]);
  const [isLoadingAllergens, setIsLoadingAllergens] = React.useState(true);
  const [editingAllergen, setEditingAllergen] = React.useState<AllergenType | null>(null);
  const [deletingAllergen, setDeletingAllergen] = React.useState<AllergenType | null>(null);
  const [isAllergenCreateDialogOpen, setIsAllergenCreateDialogOpen] = React.useState(false);

  // Diets state
  const [diets, setDiets] = React.useState<DietType[]>([]);
  const [isLoadingDiets, setIsLoadingDiets] = React.useState(true);
  const [editingDiet, setEditingDiet] = React.useState<DietType | null>(null);
  const [deletingDiet, setDeletingDiet] = React.useState<DietType | null>(null);
  const [isDietCreateDialogOpen, setIsDietCreateDialogOpen] = React.useState(false);

  // Intolerances state
  const [intolerances, setIntolerances] = React.useState<IntoleranceType[]>([]);
  const [isLoadingIntolerances, setIsLoadingIntolerances] = React.useState(true);
  const [editingIntolerance, setEditingIntolerance] = React.useState<IntoleranceType | null>(null);
  const [deletingIntolerance, setDeletingIntolerance] = React.useState<IntoleranceType | null>(null);
  const [isIntoleranceCreateDialogOpen, setIsIntoleranceCreateDialogOpen] = React.useState(false);

  // Load all data on mount
  React.useEffect(() => {
    loadAllergens();
    loadDiets();
    loadIntolerances();
  }, []);

  // Allergens handlers
  async function loadAllergens() {
    try {
      setIsLoadingAllergens(true);
      const data = await fetchAllergens();
      setAllergens(data);
    } catch (error: any) {
      console.error("Error loading allergens:", error);
      toast.error("Failed to load allergens");
    } finally {
      setIsLoadingAllergens(false);
    }
  }

  function handleCreateAllergen() {
    setEditingAllergen(null);
    setIsAllergenCreateDialogOpen(true);
  }

  function handleEditAllergen(allergen: AllergenType) {
    setEditingAllergen(allergen);
  }

  function handleDeleteAllergen(allergen: AllergenType) {
    setDeletingAllergen(allergen);
  }

  async function confirmDeleteAllergen() {
    if (!deletingAllergen) return;

    try {
      await deleteAllergen(deletingAllergen.id);
      toast.success(`Allergen "${deletingAllergen.name_es}" deleted successfully`);
      setDeletingAllergen(null);
      loadAllergens();
    } catch (error: any) {
      console.error("Error deleting allergen:", error);
      toast.error(error.message || "Failed to delete allergen");
    }
  }

  // Diets handlers
  async function loadDiets() {
    try {
      setIsLoadingDiets(true);
      const data = await fetchDiets();
      setDiets(data);
    } catch (error: any) {
      console.error("Error loading diets:", error);
      toast.error("Failed to load diets");
    } finally {
      setIsLoadingDiets(false);
    }
  }

  function handleCreateDiet() {
    setEditingDiet(null);
    setIsDietCreateDialogOpen(true);
  }

  function handleEditDiet(diet: DietType) {
    setEditingDiet(diet);
  }

  function handleDeleteDiet(diet: DietType) {
    setDeletingDiet(diet);
  }

  async function confirmDeleteDiet() {
    if (!deletingDiet) return;

    try {
      await deleteDiet(deletingDiet.id);
      toast.success(`Diet "${deletingDiet.name_es}" deleted successfully`);
      setDeletingDiet(null);
      loadDiets();
    } catch (error: any) {
      console.error("Error deleting diet:", error);
      toast.error(error.message || "Failed to delete diet");
    }
  }

  // Intolerances handlers
  async function loadIntolerances() {
    try {
      setIsLoadingIntolerances(true);
      const data = await fetchIntolerances();
      setIntolerances(data);
    } catch (error: any) {
      console.error("Error loading intolerances:", error);
      toast.error("Failed to load intolerances");
    } finally {
      setIsLoadingIntolerances(false);
    }
  }

  function handleCreateIntolerance() {
    setEditingIntolerance(null);
    setIsIntoleranceCreateDialogOpen(true);
  }

  function handleEditIntolerance(intolerance: IntoleranceType) {
    setEditingIntolerance(intolerance);
  }

  function handleDeleteIntolerance(intolerance: IntoleranceType) {
    setDeletingIntolerance(intolerance);
  }

  async function confirmDeleteIntolerance() {
    if (!deletingIntolerance) return;

    try {
      await deleteIntolerance(deletingIntolerance.id);
      toast.success(`Intolerance "${deletingIntolerance.name_es}" deleted successfully`);
      setDeletingIntolerance(null);
      loadIntolerances();
    } catch (error: any) {
      console.error("Error deleting intolerance:", error);
      toast.error(error.message || "Failed to delete intolerance");
    }
  }

  // Column definitions
  const allergenColumns: DataTableColumn<AllergenType>[] = [
    {
      key: "key",
      label: "Key",
      render: (row) => <span className="font-mono text-sm">{row.key}</span>,
    },
    {
      key: "name_es",
      label: "Name",
      render: (row) => <span className="font-medium">{row.name_es}</span>,
    },
    {
      key: "synonyms",
      label: "Synonyms",
      render: (row) => {
        const synonyms = row.synonyms || [];
        if (synonyms.length === 0) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {synonyms.slice(0, 3).map((synonym) => (
              <Badge key={synonym} variant="outline" className="text-xs">
                {synonym}
              </Badge>
            ))}
            {synonyms.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{synonyms.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "notes",
      label: "Notes",
      render: (row) => {
        if (!row.notes) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const truncated = row.notes.length > 50 ? row.notes.slice(0, 50) + "..." : row.notes;
        return <span className="text-sm">{truncated}</span>;
      },
    },
  ];

  const allergenActions: DataTableAction<AllergenType>[] = [
    {
      label: "Edit",
      variant: "ghost",
      onClick: handleEditAllergen,
    },
    {
      label: "Delete",
      variant: "destructive",
      onClick: handleDeleteAllergen,
    },
  ];

  const dietColumns: DataTableColumn<DietType>[] = [
    {
      key: "key",
      label: "Key",
      render: (row) => <span className="font-mono text-sm">{row.key}</span>,
    },
    {
      key: "name_es",
      label: "Name",
      render: (row) => <span className="font-medium">{row.name_es}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (row) => {
        if (!row.description) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const truncated =
          row.description.length > 80
            ? row.description.slice(0, 80) + "..."
            : row.description;
        return <span className="text-sm">{truncated}</span>;
      },
    },
  ];

  const dietActions: DataTableAction<DietType>[] = [
    {
      label: "Edit",
      variant: "ghost",
      onClick: handleEditDiet,
    },
    {
      label: "Delete",
      variant: "destructive",
      onClick: handleDeleteDiet,
    },
  ];

  const intoleranceColumns: DataTableColumn<IntoleranceType>[] = [
    {
      key: "key",
      label: "Key",
      render: (row) => <span className="font-mono text-sm">{row.key}</span>,
    },
    {
      key: "name_es",
      label: "Name",
      render: (row) => <span className="font-medium">{row.name_es}</span>,
    },
    {
      key: "synonyms",
      label: "Synonyms",
      render: (row) => {
        const synonyms = row.synonyms || [];
        if (synonyms.length === 0) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {synonyms.slice(0, 3).map((synonym) => (
              <Badge key={synonym} variant="outline" className="text-xs">
                {synonym}
              </Badge>
            ))}
            {synonyms.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{synonyms.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "notes",
      label: "Notes",
      render: (row) => {
        if (!row.notes) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const truncated = row.notes.length > 50 ? row.notes.slice(0, 50) + "..." : row.notes;
        return <span className="text-sm">{truncated}</span>;
      },
    },
  ];

  const intoleranceActions: DataTableAction<IntoleranceType>[] = [
    {
      label: "Edit",
      variant: "ghost",
      onClick: handleEditIntolerance,
    },
    {
      label: "Delete",
      variant: "destructive",
      onClick: handleDeleteIntolerance,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dictionaries</h1>
        <p className="text-muted-foreground mt-2">
          Manage allergens, diets, and intolerances used throughout the application
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="allergens">
              Allergens ({allergens.length})
            </TabsTrigger>
            <TabsTrigger value="diets">Diets ({diets.length})</TabsTrigger>
            <TabsTrigger value="intolerances">
              Intolerances ({intolerances.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === "allergens" && (
            <Button onClick={handleCreateAllergen}>
              <Plus className="h-4 w-4 mr-2" />
              Add Allergen
            </Button>
          )}
          {activeTab === "diets" && (
            <Button onClick={handleCreateDiet}>
              <Plus className="h-4 w-4 mr-2" />
              Add Diet
            </Button>
          )}
          {activeTab === "intolerances" && (
            <Button onClick={handleCreateIntolerance}>
              <Plus className="h-4 w-4 mr-2" />
              Add Intolerance
            </Button>
          )}
        </div>

        <TabsContent value="allergens" className="space-y-4">
          <DataTable
            data={allergens}
            columns={allergenColumns}
            actions={allergenActions}
            searchPlaceholder="Search allergens by key or name..."
            searchFn={(allergen, query) => {
              const q = query.toLowerCase();
              return (
                allergen.key.toLowerCase().includes(q) ||
                allergen.name_es.toLowerCase().includes(q) ||
                (allergen.synonyms || []).some((s) => s.toLowerCase().includes(q))
              );
            }}
            isLoading={isLoadingAllergens}
            emptyMessage="No allergens found. Add your first allergen to get started."
            getRowKey={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="diets" className="space-y-4">
          <DataTable
            data={diets}
            columns={dietColumns}
            actions={dietActions}
            searchPlaceholder="Search diets by key or name..."
            searchFn={(diet, query) => {
              const q = query.toLowerCase();
              return (
                diet.key.toLowerCase().includes(q) ||
                diet.name_es.toLowerCase().includes(q) ||
                (diet.description || "").toLowerCase().includes(q)
              );
            }}
            isLoading={isLoadingDiets}
            emptyMessage="No diets found. Add your first diet to get started."
            getRowKey={(row) => row.id}
          />
        </TabsContent>

        <TabsContent value="intolerances" className="space-y-4">
          <DataTable
            data={intolerances}
            columns={intoleranceColumns}
            actions={intoleranceActions}
            searchPlaceholder="Search intolerances by key or name..."
            searchFn={(intolerance, query) => {
              const q = query.toLowerCase();
              return (
                intolerance.key.toLowerCase().includes(q) ||
                intolerance.name_es.toLowerCase().includes(q) ||
                (intolerance.synonyms || []).some((s) => s.toLowerCase().includes(q))
              );
            }}
            isLoading={isLoadingIntolerances}
            emptyMessage="No intolerances found. Add your first intolerance to get started."
            getRowKey={(row) => row.id}
          />
        </TabsContent>
      </Tabs>

      {/* Allergen Dialogs */}
      <AllergenDialog
        open={isAllergenCreateDialogOpen || !!editingAllergen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAllergenCreateDialogOpen(false);
            setEditingAllergen(null);
          }
        }}
        allergen={editingAllergen || undefined}
        onSuccess={loadAllergens}
      />

      {deletingAllergen && (
        <DictionaryDeleteDialog
          open={!!deletingAllergen}
          onOpenChange={(open) => !open && setDeletingAllergen(null)}
          itemType="allergen"
          itemName={deletingAllergen.name_es}
          itemKey={deletingAllergen.key}
          onConfirm={confirmDeleteAllergen}
        />
      )}

      {/* Diet Dialogs */}
      <DietDialog
        open={isDietCreateDialogOpen || !!editingDiet}
        onOpenChange={(open) => {
          if (!open) {
            setIsDietCreateDialogOpen(false);
            setEditingDiet(null);
          }
        }}
        diet={editingDiet || undefined}
        onSuccess={loadDiets}
      />

      {deletingDiet && (
        <DictionaryDeleteDialog
          open={!!deletingDiet}
          onOpenChange={(open) => !open && setDeletingDiet(null)}
          itemType="diet"
          itemName={deletingDiet.name_es}
          itemKey={deletingDiet.key}
          onConfirm={confirmDeleteDiet}
        />
      )}

      {/* Intolerance Dialogs */}
      <IntoleranceDialog
        open={isIntoleranceCreateDialogOpen || !!editingIntolerance}
        onOpenChange={(open) => {
          if (!open) {
            setIsIntoleranceCreateDialogOpen(false);
            setEditingIntolerance(null);
          }
        }}
        intolerance={editingIntolerance || undefined}
        onSuccess={loadIntolerances}
      />

      {deletingIntolerance && (
        <DictionaryDeleteDialog
          open={!!deletingIntolerance}
          onOpenChange={(open) => !open && setDeletingIntolerance(null)}
          itemType="intolerance"
          itemName={deletingIntolerance.name_es}
          itemKey={deletingIntolerance.key}
          onConfirm={confirmDeleteIntolerance}
        />
      )}
    </div>
  );
}
