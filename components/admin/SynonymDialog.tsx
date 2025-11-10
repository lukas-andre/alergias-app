"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { t } from "@/lib/admin/translations";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { allergenSynonymSchema, type AllergenSynonymFormData } from "@/lib/admin/validation";
import { createSynonym, updateSynonym, type AllergenType } from "@/lib/admin/api-client";

interface SynonymWithAllergen {
  id: string;
  allergen_id: string;
  surface: string;
  locale: string;
  weight: number;
  created_at: string;
  allergen_types?: {
    id: string;
    key: string;
    name_es: string;
  };
}

interface SynonymDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  synonym?: SynonymWithAllergen;
  allergens: AllergenType[];
  onSuccess?: () => void;
}

export function SynonymDialog({
  open,
  onOpenChange,
  synonym,
  allergens,
  onSuccess,
}: SynonymDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditing = !!synonym;

  const form = useForm<AllergenSynonymFormData>({
    resolver: zodResolver(allergenSynonymSchema),
    defaultValues: synonym
      ? {
          allergen_id: synonym.allergen_id,
          surface: synonym.surface,
          locale: synonym.locale,
          weight: synonym.weight,
        }
      : {
          allergen_id: "",
          surface: "",
          locale: "es-CL",
          weight: 1,
        },
  });

  React.useEffect(() => {
    if (open && synonym) {
      form.reset({
        allergen_id: synonym.allergen_id,
        surface: synonym.surface,
        locale: synonym.locale,
        weight: synonym.weight,
      });
    } else if (open && !synonym) {
      form.reset({
        allergen_id: "",
        surface: "",
        locale: "es-CL",
        weight: 1,
      });
    }
  }, [open, synonym, form]);

  async function onSubmit(data: AllergenSynonymFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateSynonym(synonym.id, {
          ...data,
          locale: data.locale ?? "es-CL",
          weight: data.weight ?? 1,
        });
        toast.success(t("dictionaries.synonymUpdated", { surface: data.surface }));
      } else {
        await createSynonym({
          ...data,
          locale: data.locale ?? "es-CL",
          weight: data.weight ?? 1,
        });
        toast.success(t("dictionaries.synonymCreated", { surface: data.surface }));
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving synonym:", error);
      toast.error(error.message || t("dictionaries.synonymFailedSave"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("dictionaries.editSynonym") : t("dictionaries.createSynonym")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dictionaries.updateSynonymDesc")
              : t("dictionaries.addSynonymDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="allergen_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldAllergen")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("dictionaries.selectAllergen")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allergens.map((allergen) => (
                        <SelectItem key={allergen.id} value={allergen.id}>
                          {allergen.name_es} ({allergen.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isEditing
                      ? t("dictionaries.cannotChangeAllergen")
                      : t("dictionaries.selectAllergenDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="surface"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldSurface")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dictionaries.fieldSurfacePlaceholder")}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dictionaries.fieldSurfaceDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldWeight")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString() || "1"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">{t("dictionaries.weightLow")}</SelectItem>
                      <SelectItem value="2">{t("dictionaries.weightMedium")}</SelectItem>
                      <SelectItem value="3">{t("dictionaries.weightHigh")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("dictionaries.fieldWeightDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldLocale")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "es-CL"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="es-CL">es-CL (Español Chileno)</SelectItem>
                      <SelectItem value="es-ES">es-ES (Español España)</SelectItem>
                      <SelectItem value="en-US">en-US (Inglés EE.UU.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("dictionaries.fieldLocaleDesc")}
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
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.saving")
                  : isEditing
                    ? t("dictionaries.updateSynonym")
                    : t("dictionaries.createSynonym")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
