"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { allergenSynonymSchema } from "@/lib/admin/validation";
import { createSynonym, updateSynonym, type AllergenType } from "@/lib/admin/api-client";

type SynonymFormData = {
  allergen_id: string;
  surface: string;
  locale: string;
  weight: number;
};

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

  const form = useForm<SynonymFormData>({
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

  async function onSubmit(data: SynonymFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateSynonym(synonym.id, data);
        toast.success(`Synonym "${data.surface}" updated successfully`);
      } else {
        await createSynonym(data);
        toast.success(`Synonym "${data.surface}" created successfully`);
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving synonym:", error);
      toast.error(error.message || "Failed to save synonym");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Synonym" : "Create Synonym"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the synonym information below."
              : "Add a new synonym for allergen matching."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="allergen_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergen</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an allergen" />
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
                      ? "Cannot change allergen after creation"
                      : "Select which allergen this synonym belongs to"}
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
                  <FormLabel>Surface (Synonym Text)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., lacteos, productos lacteos"
                    />
                  </FormControl>
                  <FormDescription>
                    The text that will be matched against product labels
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
                  <FormLabel>Weight (Matching Priority)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 - Low priority</SelectItem>
                      <SelectItem value="2">2 - Medium priority</SelectItem>
                      <SelectItem value="3">3 - High priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Higher weight = more likely to match. Use 3 for exact
                    matches, 1 for partial/fuzzy matches.
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
                  <FormLabel>Locale</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="es-CL">es-CL (Chilean Spanish)</SelectItem>
                      <SelectItem value="es-ES">es-ES (Spain Spanish)</SelectItem>
                      <SelectItem value="en-US">en-US (US English)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Language and region for this synonym
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
                    ? "Update Synonym"
                    : "Create Synonym"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
