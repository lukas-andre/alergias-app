"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { allergenTypeSchema, type AllergenTypeFormData } from "@/lib/admin/validation";
import { createAllergen, updateAllergen, type AllergenType } from "@/lib/admin/api-client";
import { t } from "@/lib/admin/translations";

interface AllergenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allergen?: AllergenType;
  onSuccess?: () => void;
}

export function AllergenDialog({
  open,
  onOpenChange,
  allergen,
  onSuccess,
}: AllergenDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [synonymInput, setSynonymInput] = React.useState("");

  const isEditing = !!allergen;

  const form = useForm<AllergenTypeFormData>({
    resolver: zodResolver(allergenTypeSchema),
    defaultValues: allergen
      ? {
          key: allergen.key,
          name_es: allergen.name_es,
          notes: allergen.notes,
          synonyms: allergen.synonyms || [],
        }
      : {
          key: "",
          name_es: "",
          notes: null,
          synonyms: [],
        },
  });

  React.useEffect(() => {
    if (open && allergen) {
      form.reset({
        key: allergen.key,
        name_es: allergen.name_es,
        notes: allergen.notes,
        synonyms: allergen.synonyms || [],
      });
    } else if (open && !allergen) {
      form.reset({
        key: "",
        name_es: "",
        notes: null,
        synonyms: [],
      });
    }
  }, [open, allergen, form]);

  async function onSubmit(data: AllergenTypeFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateAllergen(allergen.id, {
          ...data,
          notes: data.notes ?? null,
          synonyms: data.synonyms ?? null,
        });
        toast.success(t("dictionaries.allergenUpdated", { name: data.name_es }));
      } else {
        await createAllergen({
          ...data,
          notes: data.notes ?? null,
          synonyms: data.synonyms ?? null,
        });
        toast.success(t("dictionaries.allergenCreated", { name: data.name_es }));
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving allergen:", error);
      toast.error(error.message || t("dictionaries.allergenFailedSave"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddSynonym() {
    const trimmed = synonymInput.trim();
    if (!trimmed) return;

    const currentSynonyms = form.getValues("synonyms") || [];
    if (!currentSynonyms.includes(trimmed)) {
      form.setValue("synonyms", [...currentSynonyms, trimmed]);
      setSynonymInput("");
    } else {
      toast.error(t("dictionaries.synonymAlreadyExists"));
    }
  }

  function handleRemoveSynonym(synonym: string) {
    const currentSynonyms = form.getValues("synonyms") || [];
    form.setValue(
      "synonyms",
      currentSynonyms.filter((s) => s !== synonym)
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("dictionaries.editAllergen") : t("dictionaries.createAllergen")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dictionaries.updateAllergenDesc")
              : t("dictionaries.addAllergenDesc")}
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
                      placeholder={t("dictionaries.fieldKeyPlaceholderAllergen")}
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
                      placeholder={t("dictionaries.fieldNamePlaceholderAllergen")}
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
              name="synonyms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldSynonyms")}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={synonymInput}
                          onChange={(e) => setSynonymInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSynonym();
                            }
                          }}
                          placeholder={t("dictionaries.fieldSynonymsPlaceholderAllergen")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSynonym}
                        >
                          {t("common.add")}
                        </Button>
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((synonym) => (
                            <Badge key={synonym} variant="secondary">
                              {synonym}
                              <button
                                type="button"
                                onClick={() => handleRemoveSynonym(synonym)}
                                className="ml-2 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("dictionaries.fieldSynonymsDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dictionaries.fieldNotes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder={t("dictionaries.fieldNotesPlaceholderAllergen")}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("dictionaries.fieldNotesDesc")}
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
                    ? t("dictionaries.updateAllergen")
                    : t("dictionaries.createAllergen")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
