"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  merchantApprovalSchema,
  type MerchantApprovalData,
} from "@/lib/merchants/validation";

interface Merchant {
  id: string;
  display_name: string;
  is_approved: boolean;
  billing_status: "trial" | "active" | "past_due" | "inactive";
}

interface MerchantApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  merchant: Merchant | null;
}

export function MerchantApprovalDialog({
  open,
  onClose,
  onSuccess,
  merchant,
}: MerchantApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<MerchantApprovalData>({
    resolver: zodResolver(merchantApprovalSchema),
    defaultValues: {
      is_approved: merchant?.is_approved || false,
      billing_status: merchant?.billing_status || "trial",
    },
  });

  React.useEffect(() => {
    if (open && merchant) {
      form.reset({
        is_approved: merchant.is_approved,
        billing_status: merchant.billing_status,
      });
    }
  }, [open, merchant, form]);

  async function onSubmit(data: MerchantApprovalData) {
    if (!merchant) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/merchants/${merchant.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update approval status");
      }

      toast.success(
        data.is_approved
          ? `Local "${merchant.display_name}" aprobado`
          : `Local "${merchant.display_name}" desaprobado`
      );
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update approval:", error);
      toast.error(error.message || "Error al actualizar aprobación");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!merchant) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aprobar Local</DialogTitle>
          <DialogDescription>
            Gestiona el estado de aprobación y facturación de{" "}
            <strong>{merchant.display_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="is_approved"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aprobado</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Solo los locales aprobados aparecen en el mapa/carrusel
                      público
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de Facturación</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estado..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trial">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Trial</span>
                          <span className="text-xs text-muted-foreground">
                            Período de prueba
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Active</span>
                          <span className="text-xs text-muted-foreground">
                            Suscripción activa
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="past_due">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Past Due</span>
                          <span className="text-xs text-muted-foreground">
                            Pago atrasado
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Inactive</span>
                          <span className="text-xs text-muted-foreground">
                            Sin suscripción activa
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Nota:</p>
              <p className="text-muted-foreground">
                Para que un local sea visible públicamente debe estar{" "}
                <strong>aprobado</strong> y tener estado{" "}
                <strong>trial o active</strong>.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
