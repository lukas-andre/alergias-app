"use client";

import * as React from "react";
import { Plus, Store, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn, type DataTableAction } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MerchantDialog } from "@/components/merchants/MerchantDialog";
import { MerchantDeleteDialog } from "@/components/merchants/MerchantDeleteDialog";
import { MerchantApprovalDialog } from "@/components/merchants/MerchantApprovalDialog";

interface MerchantLocation {
  id: string;
  lat: number;
  lng: number;
  address: string | null;
  region_code: string | null;
  is_primary: boolean;
}

interface Merchant {
  id: string;
  slug: string;
  display_name: string;
  short_desc: string | null;
  logo_url: string | null;
  diet_tags: string[] | null;
  categories: string[] | null;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  billing_status: "trial" | "active" | "past_due" | "inactive";
  priority_score: number;
  created_at: string;
  updated_at: string;
  merchant_locations: MerchantLocation[];
}

async function fetchMerchants(): Promise<Merchant[]> {
  const res = await fetch("/api/admin/merchants");
  if (!res.ok) {
    throw new Error("Failed to fetch merchants");
  }
  return res.json();
}

async function deleteMerchant(id: string): Promise<void> {
  const res = await fetch(`/api/admin/merchants/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete merchant");
  }
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = React.useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingMerchant, setEditingMerchant] = React.useState<Merchant | null>(null);
  const [deletingMerchant, setDeletingMerchant] = React.useState<Merchant | null>(null);
  const [approvingMerchant, setApprovingMerchant] = React.useState<Merchant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Load merchants on mount
  React.useEffect(() => {
    loadMerchants();
  }, []);

  async function loadMerchants() {
    try {
      setIsLoading(true);
      const data = await fetchMerchants();
      setMerchants(data);
    } catch (error) {
      console.error("Failed to load merchants:", error);
      toast.error("Error al cargar locales verificados");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreate() {
    setIsCreateDialogOpen(true);
  }

  function handleEdit(merchant: Merchant) {
    setEditingMerchant(merchant);
  }

  function handleDelete(merchant: Merchant) {
    setDeletingMerchant(merchant);
  }

  function handleApprove(merchant: Merchant) {
    setApprovingMerchant(merchant);
  }

  async function handleConfirmDelete() {
    if (!deletingMerchant) return;

    try {
      await deleteMerchant(deletingMerchant.id);
      toast.success(`Local "${deletingMerchant.display_name}" eliminado`);
      setDeletingMerchant(null);
      await loadMerchants();
    } catch (error) {
      console.error("Failed to delete merchant:", error);
      toast.error("Error al eliminar local");
    }
  }

  function handleDialogSuccess() {
    setIsCreateDialogOpen(false);
    setEditingMerchant(null);
    setApprovingMerchant(null);
    loadMerchants();
  }

  // Define table columns
  const columns: DataTableColumn<Merchant>[] = [
    {
      key: "display_name",
      label: "Local",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo_url ? (
            <img
              src={row.logo_url}
              alt={row.display_name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Store className="h-5 w-5 text-neutral-400" />
            </div>
          )}
          <div>
            <div className="font-semibold">{row.display_name}</div>
            <div className="text-sm text-muted-foreground">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "short_desc",
      label: "Descripción",
      render: (row) => (
        <span className="text-sm line-clamp-2">
          {row.short_desc || <span className="text-muted-foreground">Sin descripción</span>}
        </span>
      ),
    },
    {
      key: "location",
      label: "Ubicación",
      render: (row) => {
        const primaryLocation = row.merchant_locations?.find((loc) => loc.is_primary);
        if (!primaryLocation) {
          return <span className="text-sm text-muted-foreground">Sin ubicación</span>;
        }
        return (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            {primaryLocation.region_code || "N/A"}
          </div>
        );
      },
    },
    {
      key: "diet_tags",
      label: "Tags",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.diet_tags && row.diet_tags.length > 0 ? (
            <>
              {row.diet_tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {row.diet_tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{row.diet_tags.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Sin tags</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Badge
            variant={row.is_approved ? "default" : "outline"}
            className="text-xs w-fit"
          >
            {row.is_approved ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Aprobado
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Pendiente
              </>
            )}
          </Badge>
          <Badge
            variant={
              row.billing_status === "active"
                ? "default"
                : row.billing_status === "trial"
                ? "secondary"
                : "destructive"
            }
            className="text-xs w-fit"
          >
            {row.billing_status}
          </Badge>
        </div>
      ),
      className: "text-center",
    },
    {
      key: "priority_score",
      label: "Prioridad",
      render: (row) => (
        <span className="font-mono text-sm">{row.priority_score}</span>
      ),
      className: "text-center",
    },
  ];

  // Define row actions
  const actions: DataTableAction<Merchant>[] = [
    {
      label: "Aprobar/Editar Estado",
      variant: "default",
      onClick: handleApprove,
    },
    {
      label: "Editar",
      variant: "ghost",
      onClick: handleEdit,
    },
    {
      label: "Eliminar",
      variant: "destructive",
      onClick: handleDelete,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Locales Verificados</h1>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Local
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestiona los negocios certificados que aparecen en el mapa y carrusel
          público.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total
          </div>
          <div className="text-2xl font-bold">{merchants.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Aprobados
          </div>
          <div className="text-2xl font-bold">
            {merchants.filter((m) => m.is_approved).length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Activos
          </div>
          <div className="text-2xl font-bold">
            {merchants.filter((m) => m.billing_status === "active").length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Trial
          </div>
          <div className="text-2xl font-bold">
            {merchants.filter((m) => m.billing_status === "trial").length}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={merchants}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nombre..."
      />

      {/* Dialogs */}
      <MerchantDialog
        open={isCreateDialogOpen || !!editingMerchant}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingMerchant(null);
        }}
        onSuccess={handleDialogSuccess}
        merchant={editingMerchant}
      />

      <MerchantDeleteDialog
        open={!!deletingMerchant}
        onClose={() => setDeletingMerchant(null)}
        onConfirm={handleConfirmDelete}
        merchantName={deletingMerchant?.display_name || ""}
      />

      <MerchantApprovalDialog
        open={!!approvingMerchant}
        onClose={() => setApprovingMerchant(null)}
        onSuccess={handleDialogSuccess}
        merchant={approvingMerchant}
      />
    </div>
  );
}
