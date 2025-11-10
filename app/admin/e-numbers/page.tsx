"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn, type DataTableAction } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ENumberDialog } from "@/components/admin/ENumberDialog";
import { ENumberDeleteDialog } from "@/components/admin/ENumberDeleteDialog";
import { type ENumber, fetchENumbers, deleteENumber } from "@/lib/admin/api-client";

export default function ENumbersPage() {
  const [eNumbers, setENumbers] = React.useState<ENumber[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingENumber, setEditingENumber] = React.useState<ENumber | null>(null);
  const [deletingENumber, setDeletingENumber] = React.useState<ENumber | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Load E-numbers on mount
  React.useEffect(() => {
    loadENumbers();
  }, []);

  async function loadENumbers() {
    try {
      setIsLoading(true);
      const data = await fetchENumbers();
      setENumbers(data);
    } catch (error) {
      console.error("Failed to load e-numbers:", error);
      toast.error("Failed to load e-numbers");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreate() {
    setIsCreateDialogOpen(true);
  }

  function handleEdit(eNumber: ENumber) {
    setEditingENumber(eNumber);
  }

  function handleDelete(eNumber: ENumber) {
    setDeletingENumber(eNumber);
  }

  async function handleConfirmDelete() {
    if (!deletingENumber) return;

    try {
      await deleteENumber(deletingENumber.code);
      toast.success(`E-number ${deletingENumber.code} deleted`);
      setDeletingENumber(null);
      await loadENumbers();
    } catch (error) {
      console.error("Failed to delete e-number:", error);
      toast.error("Failed to delete e-number");
    }
  }

  function handleDialogSuccess() {
    setIsCreateDialogOpen(false);
    setEditingENumber(null);
    loadENumbers();
  }

  // Define table columns
  const columns: DataTableColumn<ENumber>[] = [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <span className="font-mono font-semibold">{row.code}</span>
      ),
    },
    {
      key: "name_es",
      label: "Name (ES)",
      render: (row) => row.name_es,
    },
    {
      key: "origins",
      label: "Origins",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.likely_origins.slice(0, 3).map((origin) => (
            <Badge key={origin} variant="secondary" className="text-xs">
              {origin}
            </Badge>
          ))}
          {row.likely_origins.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.likely_origins.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "allergens",
      label: "Linked Allergens",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.linked_allergen_keys.length === 0 ? (
            <span className="text-sm text-muted-foreground">None</span>
          ) : (
            <>
              {row.linked_allergen_keys.slice(0, 2).map((key) => (
                <Badge key={key} variant="default" className="text-xs">
                  {key}
                </Badge>
              ))}
              {row.linked_allergen_keys.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{row.linked_allergen_keys.length - 2}
                </Badge>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: "protein_risk",
      label: "Protein Risk",
      render: (row) => (
        <Badge
          variant={row.residual_protein_risk ? "destructive" : "outline"}
          className="text-xs"
        >
          {row.residual_protein_risk ? "Yes" : "No"}
        </Badge>
      ),
      className: "text-center",
    },
  ];

  // Define row actions
  const actions: DataTableAction<ENumber>[] = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-numbers</h1>
          <p className="text-muted-foreground mt-2">
            Manage food additives and their allergen links
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add E-number
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={eNumbers}
        columns={columns}
        actions={actions}
        searchPlaceholder="Search by code or name..."
        emptyMessage="No E-numbers found. Create one to get started."
        isLoading={isLoading}
        getRowKey={(row) => row.code}
      />

      {/* Create Dialog */}
      <ENumberDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Dialog */}
      {editingENumber && (
        <ENumberDialog
          open={!!editingENumber}
          onOpenChange={(open) => !open && setEditingENumber(null)}
          eNumber={editingENumber}
          onSuccess={handleDialogSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingENumber && (
        <ENumberDeleteDialog
          open={!!deletingENumber}
          onOpenChange={(open) => !open && setDeletingENumber(null)}
          eNumber={deletingENumber}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
