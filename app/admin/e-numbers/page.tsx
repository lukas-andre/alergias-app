"use client";

import * as React from "react";
import { Plus, Hash } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn, type DataTableAction } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ENumberDialog } from "@/components/admin/ENumberDialog";
import { ENumberDeleteDialog } from "@/components/admin/ENumberDeleteDialog";
import { type ENumber, fetchENumbers, deleteENumber } from "@/lib/admin/api-client";
import { t } from "@/lib/admin/translations";

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
      toast.error(t("eNumbers.failedToLoad"));
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
      toast.success(t("eNumbers.deleted", { code: deletingENumber.code }));
      setDeletingENumber(null);
      await loadENumbers();
    } catch (error) {
      console.error("Failed to delete e-number:", error);
      toast.error(t("eNumbers.failedToDelete"));
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
      label: t("eNumbers.colCode"),
      render: (row) => (
        <span className="font-mono font-semibold">{row.code}</span>
      ),
    },
    {
      key: "name_es",
      label: t("eNumbers.colName"),
      render: (row) => row.name_es,
    },
    {
      key: "origins",
      label: t("eNumbers.colOrigins"),
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
      label: t("eNumbers.colLinkedAllergens"),
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.linked_allergen_keys.length === 0 ? (
            <span className="text-sm text-muted-foreground">{t("common.none")}</span>
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
      label: t("eNumbers.colProteinRisk"),
      render: (row) => (
        <Badge
          variant={row.residual_protein_risk ? "destructive" : "outline"}
          className="text-xs"
        >
          {row.residual_protein_risk ? t("common.yes") : t("common.no")}
        </Badge>
      ),
      className: "text-center",
    },
  ];

  // Define row actions
  const actions: DataTableAction<ENumber>[] = [
    {
      label: t("common.edit"),
      variant: "ghost",
      onClick: handleEdit,
    },
    {
      label: t("common.delete"),
      variant: "destructive",
      onClick: handleDelete,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hash className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("eNumbers.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("eNumbers.description")}
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t("eNumbers.addButton")}
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={eNumbers}
        columns={columns}
        actions={actions}
        searchPlaceholder={t("eNumbers.searchPlaceholder")}
        emptyMessage={t("eNumbers.emptyMessage")}
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
