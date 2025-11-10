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
import { allergenTypeSchema } from "@/lib/admin/validation";
import { createAllergen, updateAllergen } from "@/lib/admin/api-client";
import type { AllergenType } from "@/lib/supabase/types";

type AllergenFormData = {
  key: string;
  name_es: string;
  notes: string | null;
  synonyms: string[];
};

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

  const form = useForm<AllergenFormData>({
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

  async function onSubmit(data: AllergenFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateAllergen(allergen.id, data);
        toast.success(`Allergen "${data.name_es}" updated successfully`);
      } else {
        await createAllergen(data);
        toast.success(`Allergen "${data.name_es}" created successfully`);
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving allergen:", error);
      toast.error(error.message || "Failed to save allergen");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddSynonym() {
    const trimmed = synonymInput.trim();
    if (!trimmed) return;

    const currentSynonyms = form.getValues("synonyms");
    if (!currentSynonyms.includes(trimmed)) {
      form.setValue("synonyms", [...currentSynonyms, trimmed]);
      setSynonymInput("");
    } else {
      toast.error("Synonym already exists");
    }
  }

  function handleRemoveSynonym(synonym: string) {
    const currentSynonyms = form.getValues("synonyms");
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
            {isEditing ? "Edit Allergen" : "Create Allergen"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the allergen information below."
              : "Add a new allergen to the dictionary."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isEditing}
                      className="font-mono"
                      placeholder="e.g., milk, gluten, peanuts"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier in lowercase (cannot be changed after
                    creation)
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
                  <FormLabel>Name (Spanish)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Leche, Gluten, Maní"
                    />
                  </FormControl>
                  <FormDescription>
                    Display name in Spanish (Chilean locale)
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
                  <FormLabel>Synonyms</FormLabel>
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
                          placeholder="e.g., lácteos, productos lácteos"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSynonym}
                        >
                          Add
                        </Button>
                      </div>
                      {field.value.length > 0 && (
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
                    Alternative names for matching (press Enter to add)
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Additional information about this allergen..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Internal notes for reference
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Allergen"
                    : "Create Allergen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
