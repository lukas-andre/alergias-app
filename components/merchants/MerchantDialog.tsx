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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { merchantSchema, type MerchantFormData } from "@/lib/merchants/validation";

interface Merchant {
  id: string;
  slug: string;
  display_name: string;
  short_desc: string | null;
  logo_url: string | null;
  diet_tags: string[] | null;
  categories: string[] | null;
  billing_status: "trial" | "active" | "past_due" | "inactive";
  priority_score: number;
}

interface MerchantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  merchant?: Merchant | null;
}

export function MerchantDialog({
  open,
  onClose,
  onSuccess,
  merchant,
}: MerchantDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditing = !!merchant;

  const form = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: merchant
      ? {
          slug: merchant.slug,
          display_name: merchant.display_name,
          short_desc: merchant.short_desc || "",
          logo_url: merchant.logo_url || "",
          diet_tags: merchant.diet_tags || [],
          categories: merchant.categories || [],
          is_approved: false, // Not editable here
          billing_status: merchant.billing_status,
          priority_score: merchant.priority_score,
        }
      : {
          slug: "",
          display_name: "",
          short_desc: "",
          logo_url: "",
          diet_tags: [],
          categories: [],
          is_approved: false,
          billing_status: "trial",
          priority_score: 50,
        },
  });

  React.useEffect(() => {
    if (open && merchant) {
      form.reset({
        slug: merchant.slug,
        display_name: merchant.display_name,
        short_desc: merchant.short_desc || "",
        logo_url: merchant.logo_url || "",
        diet_tags: merchant.diet_tags || [],
        categories: merchant.categories || [],
        is_approved: false,
        billing_status: merchant.billing_status,
        priority_score: merchant.priority_score,
      });
    } else if (open && !merchant) {
      form.reset({
        slug: "",
        display_name: "",
        short_desc: "",
        logo_url: "",
        diet_tags: [],
        categories: [],
        is_approved: false,
        billing_status: "trial",
        priority_score: 50,
      });
    }
  }, [open, merchant, form]);

  async function onSubmit(data: MerchantFormData) {
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/admin/merchants/${merchant.id}`
        : "/api/admin/merchants";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save merchant");
      }

      toast.success(isEditing ? "Local actualizado" : "Local creado");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to save merchant:", error);
      toast.error(error.message || "Error al guardar local");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Local" : "Nuevo Local"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos del local verificado"
              : "Crea un nuevo local verificado. Usa 'Aprobar/Editar Estado' para aprobarlo."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Local *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Café Andino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej: cafe-andino"
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    Solo letras minúsculas, números y guiones. No se puede cambiar después.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Corta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Cafetería con opciones sin gluten y veganas"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Logo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de Pago</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Mayor = aparece primero
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diet_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags Dietarios (separados por coma)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="sin_gluten, vegano, sin_lactosa"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean);
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías (separadas por coma)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="cafe, restaurante, panaderia"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const cats = e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean);
                        field.onChange(cats);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
