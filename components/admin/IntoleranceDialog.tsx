"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { intoleranceTypeSchema, type IntoleranceTypeFormData } from "@/lib/admin/validation";
import { createIntolerance, updateIntolerance, type IntoleranceType } from "@/lib/admin/api-client";

interface IntoleranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intolerance?: IntoleranceType;
  onSuccess?: () => void;
}

export function IntoleranceDialog({
  open,
  onOpenChange,
  intolerance,
  onSuccess,
}: IntoleranceDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [synonymInput, setSynonymInput] = React.useState("");

  const isEditing = !!intolerance;

  const form = useForm<IntoleranceTypeFormData>({
    resolver: zodResolver(intoleranceTypeSchema),
    defaultValues: intolerance
      ? {
          key: intolerance.key,
          name_es: intolerance.name_es,
          notes: intolerance.notes,
          synonyms: intolerance.synonyms || [],
        }
      : {
          key: "",
          name_es: "",
          notes: null,
          synonyms: [],
        },
  });

  React.useEffect(() => {
    if (open && intolerance) {
      form.reset({
        key: intolerance.key,
        name_es: intolerance.name_es,
        notes: intolerance.notes,
        synonyms: intolerance.synonyms || [],
      });
    } else if (open && !intolerance) {
      form.reset({
        key: "",
        name_es: "",
        notes: null,
        synonyms: [],
      });
    }
  }, [open, intolerance, form]);

  async function onSubmit(data: IntoleranceTypeFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateIntolerance(intolerance.id, {
          ...data,
          notes: data.notes ?? null,
          synonyms: data.synonyms ?? null,
        });
        toast.success(t("dictionaries.intoleranceUpdated", { name: data.name_es }));
      } else {
        await createIntolerance({
          ...data,
          notes: data.notes ?? null,
          synonyms: data.synonyms ?? null,
        });
        toast.success(t("dictionaries.intoleranceCreated", { name: data.name_es }));
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving intolerance:", error);
      toast.error(error.message || t("dictionaries.intoleranceFailedSave"));
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
            {isEditing ? t("dictionaries.editIntolerance") : t("dictionaries.createIntolerance")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("dictionaries.updateIntoleranceDesc")
              : t("dictionaries.addIntoleranceDesc")}
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
                      placeholder={t("dictionaries.fieldKeyPlaceholderIntolerance")}
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
                      placeholder={t("dictionaries.fieldNamePlaceholderIntolerance")}
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
                          placeholder={t("dictionaries.fieldSynonymsPlaceholderIntolerance")}
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
                      placeholder={t("dictionaries.fieldNotesPlaceholderIntolerance")}
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
                    ? t("dictionaries.updateIntolerance")
                    : t("dictionaries.createIntolerance")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
