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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { X, Sparkles } from "lucide-react";
import { eNumberSchema, type ENumberFormData } from "@/lib/admin/validation";
import {
  type ENumber,
  createENumber,
  updateENumber,
  fetchOrigins,
  fetchAllergens,
  type AllergenType,
} from "@/lib/admin/api-client";
import { t } from "@/lib/admin/translations";

interface ENumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eNumber?: ENumber;
  onSuccess?: () => void;
}

export function ENumberDialog({
  open,
  onOpenChange,
  eNumber,
  onSuccess,
}: ENumberDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Autocomplete data
  const [origins, setOrigins] = React.useState<Array<{ origin: string; count: number }>>([]);
  const [allergens, setAllergens] = React.useState<AllergenType[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  const isEditing = !!eNumber;

  const form = useForm<ENumberFormData>({
    resolver: zodResolver(eNumberSchema),
    defaultValues: eNumber
      ? {
          code: eNumber.code,
          name_es: eNumber.name_es,
          likely_origins: eNumber.likely_origins,
          linked_allergen_keys: eNumber.linked_allergen_keys,
          residual_protein_risk: eNumber.residual_protein_risk,
          notes: eNumber.notes || "",
        }
      : {
          code: "",
          name_es: "",
          likely_origins: [],
          linked_allergen_keys: [],
          residual_protein_risk: false,
          notes: "",
        },
  });

  // Fetch autocomplete data when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoadingData(true);
      Promise.all([fetchOrigins(), fetchAllergens()])
        .then(([originsData, allergensData]) => {
          setOrigins(originsData);
          setAllergens(allergensData);
        })
        .catch((error) => {
          console.error("Failed to load autocomplete data:", error);
          toast.error("Error al cargar datos de autocompletado");
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [open]);

  async function onSubmit(data: ENumberFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateENumber(eNumber.code, {
          name_es: data.name_es,
          likely_origins: data.likely_origins || [],
          linked_allergen_keys: data.linked_allergen_keys || [],
          residual_protein_risk: data.residual_protein_risk ?? false,
          notes: data.notes || null,
        });
        toast.success(t("eNumbers.updated", { code: data.code }));
      } else {
        await createENumber({
          ...data,
          likely_origins: data.likely_origins || [],
          linked_allergen_keys: data.linked_allergen_keys || [],
          residual_protein_risk: data.residual_protein_risk ?? false,
          notes: data.notes || null,
        });
        toast.success(t("eNumbers.created", { code: data.code }));
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save e-number:", error);
      toast.error(error.message || t("eNumbers.failedToSave"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRemoveOrigin(origin: string) {
    const currentOrigins = form.getValues("likely_origins") || [];
    form.setValue(
      "likely_origins",
      currentOrigins.filter((o) => o !== origin)
    );
  }

  function handleRemoveAllergen(key: string) {
    const currentAllergens = form.getValues("linked_allergen_keys") || [];
    form.setValue(
      "linked_allergen_keys",
      currentAllergens.filter((k) => k !== key)
    );
  }

  // Prepare options for Combobox
  const originOptions: ComboboxOption[] = origins.map((o) => ({
    value: o.origin,
    label: o.origin,
    description: `Usado en ${o.count} número(s) E`,
  }));

  const allergenOptions: ComboboxOption[] = allergens.map((a) => ({
    value: a.key,
    label: a.name_es,
    description: a.key,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("eNumbers.dialogEditTitle", { code: eNumber.code }) : t("eNumbers.dialogCreateTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("eNumbers.dialogUpdateDesc")
              : t("eNumbers.dialogCreateDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("eNumbers.fieldCode")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("eNumbers.fieldCodePlaceholder")}
                      {...field}
                      disabled={isEditing}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("eNumbers.fieldCodeDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name (Spanish) */}
            <FormField
              control={form.control}
              name="name_es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("eNumbers.fieldName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("eNumbers.fieldNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Likely Origins */}
            <FormField
              control={form.control}
              name="likely_origins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orígenes Probables</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Combobox
                          options={originOptions}
                          value=""
                          onValueChange={(value) => {
                            const currentOrigins = form.getValues("likely_origins") || [];
                            if (!currentOrigins.includes(value)) {
                              form.setValue("likely_origins", [...currentOrigins, value]);
                            }
                          }}
                          placeholder="Seleccionar origen..."
                          searchPlaceholder="Buscar origen..."
                          emptyMessage="No se encontraron orígenes"
                          allowCustom={true}
                          onCustomValue={(value) => {
                            const currentOrigins = form.getValues("likely_origins") || [];
                            if (!currentOrigins.includes(value)) {
                              form.setValue("likely_origins", [...currentOrigins, value]);
                            }
                          }}
                          disabled={isLoadingData}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value?.map((origin) => (
                        <Badge key={origin} variant="secondary">
                          {origin}
                          <button
                            type="button"
                            onClick={() => handleRemoveOrigin(origin)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <FormDescription>
                    Posibles fuentes de este aditivo (ej., soja, huevo)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linked Allergen Keys */}
            <FormField
              control={form.control}
              name="linked_allergen_keys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Alérgenos Vinculados
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Combobox
                          options={allergenOptions}
                          value=""
                          onValueChange={(value) => {
                            const currentAllergens = form.getValues("linked_allergen_keys") || [];
                            if (!currentAllergens.includes(value)) {
                              form.setValue("linked_allergen_keys", [...currentAllergens, value]);
                            }
                          }}
                          placeholder="Seleccionar alérgeno..."
                          searchPlaceholder="Buscar alérgeno..."
                          emptyMessage="No se encontraron alérgenos"
                          allowCustom={true}
                          onCustomValue={(value) => {
                            // For now, add custom value directly
                            // TODO: In future, show inline creation dialog
                            const currentAllergens = form.getValues("linked_allergen_keys") || [];
                            if (!currentAllergens.includes(value)) {
                              form.setValue("linked_allergen_keys", [...currentAllergens, value]);
                              toast.info(`Nota: "${value}" será agregado. Asegúrate de que exista en Diccionarios > Alérgenos.`);
                            }
                          }}
                          disabled={isLoadingData}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value?.map((key) => {
                        const allergen = allergens.find((a) => a.key === key);
                        return (
                          <Badge key={key} variant={allergen ? "default" : "outline"}>
                            {allergen ? allergen.name_es : key}
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergen(key)}
                              className="ml-1 hover:text-destructive-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <FormDescription>
                    Claves de alérgenos que este aditivo puede contener
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Residual Protein Risk */}
            <FormField
              control={form.control}
              name="residual_protein_risk"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("eNumbers.fieldProteinRisk")}
                    </FormLabel>
                    <FormDescription>
                      {t("eNumbers.fieldProteinRiskDesc")}
                    </FormDescription>
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("eNumbers.fieldNotes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("eNumbers.fieldNotesPlaceholder")}
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.saving")
                  : isEditing
                    ? t("common.update")
                    : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
