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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dietTypeSchema } from "@/lib/admin/validation";
import { createDiet, updateDiet } from "@/lib/admin/api-client";
import type { DietType } from "@/lib/supabase/types";

type DietFormData = {
  key: string;
  name_es: string;
  description: string | null;
};

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

  const form = useForm<DietFormData>({
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

  async function onSubmit(data: DietFormData) {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateDiet(diet.id, data);
        toast.success(`Diet "${data.name_es}" updated successfully`);
      } else {
        await createDiet(data);
        toast.success(`Diet "${data.name_es}" created successfully`);
      }

      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving diet:", error);
      toast.error(error.message || "Failed to save diet");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Diet" : "Create Diet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the diet information below."
              : "Add a new diet to the dictionary."}
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
                      placeholder="e.g., vegetarian, vegan, keto"
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
                      placeholder="e.g., Vegetariano, Vegano, Keto"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Brief description of this diet type..."
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    User-facing description of the diet
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
                    ? "Update Diet"
                    : "Create Diet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
