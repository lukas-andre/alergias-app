"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FeedbackCategory } from "@/lib/feedback/types";
import { FEEDBACK_CATEGORY_LABELS } from "@/lib/feedback/types";

const reportErrorSchema = z.object({
  category: z.enum([
    "wrong_allergen",
    "wrong_verdict",
    "missing_ingredient",
    "ui_issue",
    "performance",
    "other",
  ] as const),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(1000, "El mensaje no puede exceder 1000 caracteres"),
});

type ReportErrorFormData = z.infer<typeof reportErrorSchema>;

interface ReportErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractionId?: string;
  verdictLevel?: string;
}

export function ReportErrorDialog({
  open,
  onOpenChange,
  extractionId,
  verdictLevel,
}: ReportErrorDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ReportErrorFormData>({
    resolver: zodResolver(reportErrorSchema),
    defaultValues: {
      category: "wrong_verdict",
      message: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        category: "wrong_verdict",
        message: "",
      });
    }
  }, [open, form]);

  async function onSubmit(data: ReportErrorFormData) {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: "error_report",
          category: data.category,
          message: data.message,
          severity: "medium",
          extraction_id: extractionId,
          metadata: {
            url: window.location.href,
            user_agent: navigator.userAgent,
            verdict_level: verdictLevel,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al enviar el reporte");
      }

      toast.success(
        "Reporte enviado correctamente. Gracias por ayudarnos a mejorar."
      );
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error(error.message || "Error al enviar el reporte. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Reportar Error
          </DialogTitle>
          <DialogDescription>
            Ayúdanos a mejorar reportando cualquier problema que encuentres con el
            análisis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Error</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de error" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FEEDBACK_CATEGORY_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ¿Qué tipo de problema encontraste?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el problema en detalle. Por ejemplo: 'El sistema no detectó que el producto contiene leche' o 'El veredicto debería ser alto riesgo pero marca medio'"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 10 caracteres, máximo 1000
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Reporte"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
