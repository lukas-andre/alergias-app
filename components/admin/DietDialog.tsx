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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dietTypeSchema, type DietTypeFormData } from "@/lib/admin/validation";
import { createDiet, updateDiet, type DietType } from "@/lib/admin/api-client";

interface DietDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diet?: DietType;
  onSuccess?: () => void;
}

export function DietDialog({
  open,
  onOpenChange,
  diet,
  onSuccess,
}: DietDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditing = !!diet;

  const form = useForm<DietTypeFormData>({
    resolver: zodResolver(dietTypeSchema),
    defaultValues: diet
      ? {
          key: diet.key,
          name_es: diet.name_es,
          description: diet.description,
        }
      : {
          key: "",
          name_es: "",
          description: null,
        },
  });

  React.useEffect(() => {
    if (open && diet) {
      form.reset({
        key: diet.key,
        name_es: diet.name_es,
        description: diet.description,
      });
    } else if (open && !diet) {
      form.reset({
        key: "",
        name_es: "",
        description: null,
      });
    }
  }, [open, diet, form]);

  async function onSubmit(data: DietTypeFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateDiet(diet.id, {
          ...data,
          description: data.description ?? null,
        });
        toast.success(t("dictionaries.dietUpdated", { name: data.name_es }));
      } else {
        await createDiet({
          ...data,
          description: data.description ?? null,
        });
        toast.success(t("dictionaries.dietCreated", { name: data.name_es }));
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving diet:", error);
      toast.error(error.message || t("dictionaries.dietFailedSave"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("dictionaries.editDiet") : t("dictionaries.createDiet")}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dictionaries.updateDietDesc")
              : t("dictionaries.addDietDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldKey")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isEditing}
                      className="font-mono"
                      placeholder={t("dictionaries.fieldKeyPlaceholderDiet")}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dictionaries.fieldKeyDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name_es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldName")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("dictionaries.fieldNamePlaceholderDiet")}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dictionaries.fieldNameDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder={t("dictionaries.fieldDescriptionPlaceholderDiet")}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dictionaries.fieldDescriptionDesc")}
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
                    ? t("dictionaries.updateDiet")
                    : t("dictionaries.createDiet")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
