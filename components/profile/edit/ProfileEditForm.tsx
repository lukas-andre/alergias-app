/**
 * ProfileEditForm - Container component for profile editing
 *
 * Organizes editing sections into tabs:
 * - Basic Info
 * - Diets
 * - Allergens
 * - Intolerances
 */

"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { profileEditSchema, type ProfileEditFormData } from "@/lib/schemas/profile-edit.schema";
import { BasicInfoSection } from "./BasicInfoSection";
import { DietsSection } from "./DietsSection";
import { AllergensSection } from "./AllergensSection";
import { IntolerancesSection } from "./IntolerancesSection";

export interface ProfileEditFormProps {
  initialData: Partial<ProfileEditFormData>;
  onSave: (data: ProfileEditFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function ProfileEditForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: ProfileEditFormProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema) as Resolver<ProfileEditFormData>,
    defaultValues: {
      basicData: initialData.basicData || {
        display_name: "",
        notes: "",
        pregnant: false,
      },
      diets: initialData.diets || {
        diets: [],
      },
      allergens: initialData.allergens || {
        allergens: [],
      },
      intolerances: initialData.intolerances || {
        intolerances: [],
      },
    },
  });

  const handleSubmit = async (data: ProfileEditFormData) => {
    await onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Tabbed Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Info Básica</TabsTrigger>
            <TabsTrigger value="diets">Dietas</TabsTrigger>
            <TabsTrigger value="allergens">Alergias</TabsTrigger>
            <TabsTrigger value="intolerances">Intolerancias</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <BasicInfoSection control={form.control} />
          </TabsContent>

          <TabsContent value="diets" className="mt-6">
            <DietsSection control={form.control} />
          </TabsContent>

          <TabsContent value="allergens" className="mt-6">
            <AllergensSection control={form.control} />
          </TabsContent>

          <TabsContent value="intolerances" className="mt-6">
            <IntolerancesSection control={form.control} />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
