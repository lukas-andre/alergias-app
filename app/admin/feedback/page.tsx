"use client";

import * as React from "react";
import { MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn, type DataTableAction } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackDetailDialog } from "@/components/admin/FeedbackDetailDialog";
import type { Feedback } from "@/lib/feedback/types";
import {
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_SEVERITY_LABELS,
} from "@/lib/feedback/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = React.useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedFeedback, setSelectedFeedback] = React.useState<Feedback | null>(null);

  // Load feedback on mount
  React.useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/feedback");
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      const result = await response.json();
      setFeedbackList(result.data || []);
    } catch (error) {
      console.error("Failed to load feedback:", error);
      toast.error("Error al cargar los reportes de feedback");
    } finally {
      setIsLoading(false);
    }
  }

  function handleViewDetail(feedback: Feedback) {
    setSelectedFeedback(feedback);
  }

  async function handleStatusUpdate(feedbackId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update feedback status");
      }

      toast.success("Estado actualizado correctamente");
      await loadFeedback();
      setSelectedFeedback(null);
    } catch (error) {
      console.error("Failed to update feedback:", error);
      toast.error("Error al actualizar el estado");
    }
  }

  // Badge variant helper
  function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
    switch (status) {
      case "pending":
        return "default";
      case "reviewed":
        return "secondary";
      case "resolved":
        return "outline";
      case "closed":
        return "outline";
      default:
        return "default";
    }
  }

  function getSeverityVariant(severity: string): "default" | "secondary" | "outline" | "destructive" {
    switch (severity) {
      case "low":
        return "outline";
      case "medium":
        return "secondary";
      case "high":
        return "default";
      case "critical":
        return "destructive";
      default:
        return "default";
    }
  }

  // Define table columns
  const columns: DataTableColumn<Feedback>[] = [
    {
      key: "created_at",
      label: "Fecha",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </span>
      ),
    },
    {
      key: "feedback_type",
      label: "Tipo",
      render: (row) => (
        <Badge variant="secondary" className="text-xs">
          {FEEDBACK_TYPE_LABELS[row.feedback_type]}
        </Badge>
      ),
    },
    {
      key: "category",
      label: "Categoría",
      render: (row) => (
        <span className="text-sm">
          {row.category ? FEEDBACK_CATEGORY_LABELS[row.category] : "-"}
        </span>
      ),
    },
    {
      key: "severity",
      label: "Severidad",
      render: (row) => (
        <Badge variant={getSeverityVariant(row.severity)} className="text-xs">
          {FEEDBACK_SEVERITY_LABELS[row.severity]}
        </Badge>
      ),
    },
    {
      key: "message",
      label: "Mensaje",
      render: (row) => (
        <span className="text-sm line-clamp-2 max-w-md">
          {row.message}
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)} className="text-xs">
          {FEEDBACK_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<Feedback>[] = [
    {
      label: "Ver Detalle",
      variant: "ghost",
      onClick: handleViewDetail,
    },
  ];

  // Count pending feedback
  const pendingCount = feedbackList.filter(f => f.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes de Feedback</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona los reportes de errores y sugerencias de los usuarios
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              {pendingCount} {pendingCount === 1 ? "reporte pendiente" : "reportes pendientes"}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={feedbackList}
        columns={columns}
        actions={actions}
        searchPlaceholder="Buscar por mensaje o categoría..."
        emptyMessage="No hay reportes de feedback"
        isLoading={isLoading}
        getRowKey={(row) => row.id}
      />

      {/* Detail Dialog */}
      {selectedFeedback && (
        <FeedbackDetailDialog
          open={!!selectedFeedback}
          onOpenChange={(open) => !open && setSelectedFeedback(null)}
          feedback={selectedFeedback}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
