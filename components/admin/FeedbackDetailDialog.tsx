"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Feedback } from "@/lib/feedback/types";
import {
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_SEVERITY_LABELS,
} from "@/lib/feedback/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalLink, User, Calendar, Tag, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface FeedbackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: Feedback;
  onStatusUpdate: (feedbackId: string, newStatus: string) => Promise<void>;
}

export function FeedbackDetailDialog({
  open,
  onOpenChange,
  feedback,
  onStatusUpdate,
}: FeedbackDetailDialogProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  async function handleStatusChange(newStatus: string) {
    try {
      setIsUpdating(true);
      await onStatusUpdate(feedback.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  }

  // Badge variant helpers
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Reporte</DialogTitle>
          <DialogDescription>
            Información completa del reporte de feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tipo:</span>
              <Badge variant="secondary">
                {FEEDBACK_TYPE_LABELS[feedback.feedback_type]}
              </Badge>
            </div>

            {feedback.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Categoría:</span>
                <span className="text-sm">{FEEDBACK_CATEGORY_LABELS[feedback.category]}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Severidad:</span>
              <Badge variant={getSeverityVariant(feedback.severity)}>
                {FEEDBACK_SEVERITY_LABELS[feedback.severity]}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Fecha:</span>
              <span className="text-sm">
                {format(new Date(feedback.created_at), "PPpp", { locale: es })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Usuario ID:</span>
              <span className="text-sm font-mono text-muted-foreground">
                {feedback.user_id.slice(0, 8)}...
              </span>
            </div>
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Mensaje del Usuario</h4>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
            </div>
          </div>

          {/* Extraction Link */}
          {feedback.extraction_id && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Escaneo Relacionado</h4>
                <Link href={`/scan/result/${feedback.extraction_id}`} target="_blank">
                  <Button variant="outline" size="sm" className="gap-2">
                    Ver Resultado del Escaneo
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Metadata */}
          {feedback.metadata && Object.keys(feedback.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Metadatos</h4>
                <div className="bg-muted p-4 rounded-lg space-y-1.5">
                  {feedback.metadata.url && (
                    <div className="text-sm">
                      <span className="font-medium">URL:</span>{" "}
                      <a
                        href={feedback.metadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {feedback.metadata.url}
                      </a>
                    </div>
                  )}
                  {feedback.metadata.verdict_level && (
                    <div className="text-sm">
                      <span className="font-medium">Nivel de Veredicto:</span>{" "}
                      {feedback.metadata.verdict_level}
                    </div>
                  )}
                  {feedback.metadata.user_agent && (
                    <div className="text-sm">
                      <span className="font-medium">User Agent:</span>{" "}
                      <span className="text-muted-foreground font-mono text-xs">
                        {feedback.metadata.user_agent}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Status Section */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">Estado Actual:</h4>
              <Badge variant={getStatusVariant(feedback.status)}>
                {FEEDBACK_STATUS_LABELS[feedback.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {feedback.status !== "reviewed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("reviewed")}
                  disabled={isUpdating}
                >
                  Marcar como Revisado
                </Button>
              )}
              {feedback.status !== "resolved" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("resolved")}
                  disabled={isUpdating}
                >
                  Marcar como Resuelto
                </Button>
              )}
              {feedback.status !== "closed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("closed")}
                  disabled={isUpdating}
                >
                  Cerrar
                </Button>
              )}
            </div>
          </div>

          {/* Admin Notes (if any) */}
          {feedback.admin_notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Notas del Administrador</h4>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm">{feedback.admin_notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Resolution Info */}
          {feedback.resolved_at && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Información de Resolución</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Resuelto el:</span>{" "}
                    {format(new Date(feedback.resolved_at), "PPpp", { locale: es })}
                  </div>
                  {feedback.resolved_by && (
                    <div>
                      <span className="font-medium">Resuelto por:</span>{" "}
                      <span className="font-mono text-muted-foreground">
                        {feedback.resolved_by.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
