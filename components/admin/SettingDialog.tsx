"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { updateSetting, type AppSetting } from "@/lib/admin/api-client";

const settingFormSchema = z.object({
  value: z.any(),
  description: z.string().nullable().optional(),
});

type SettingFormData = z.infer<typeof settingFormSchema>;

interface SettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: AppSetting;
  onSuccess?: () => void;
}

export function SettingDialog({
  open,
  onOpenChange,
  setting,
  onSuccess,
}: SettingDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const valueType = typeof setting.value;
  const isBoolean = valueType === "boolean";
  const isNumber = valueType === "number";
  const isString = valueType === "string";

  const form = useForm<SettingFormData>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      value: setting.value,
      description: setting.description,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        value: setting.value,
        description: setting.description,
      });
      setJsonError(null);
    }
  }, [open, setting, form]);

  async function onSubmit(data: SettingFormData) {
    try {
      setIsSubmitting(true);

      // Parse JSON if it's a complex type
      let finalValue = data.value;
      if (!isBoolean && !isNumber && !isString) {
        try {
          finalValue = JSON.parse(data.value);
        } catch (error) {
          setJsonError(t("settings.invalidJson"));
          return;
        }
      }

      await updateSetting(setting.key, {
        value: finalValue,
        description: data.description || undefined,
      });

      toast.success(t("settings.settingUpdated", { key: setting.key }));
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast.error(error.message || t("settings.settingFailedUpdate"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleJsonChange(value: string) {
    form.setValue("value", value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError(t("settings.invalidJson"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("settings.editSettingTitle", { key: setting.key })}</DialogTitle>
          <DialogDescription>
            {t("settings.editSettingDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.fieldValue")}</FormLabel>
                  <FormControl>
                    {isBoolean ? (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">
                            {field.value ? t("settings.enabled") : t("settings.disabled")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("settings.toggleDesc")}
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    ) : isNumber ? (
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    ) : isString ? (
                      <Input {...field} />
                    ) : (
                      <div className="space-y-2">
                        <Textarea
                          {...field}
                          value={
                            typeof field.value === "string"
                              ? field.value
                              : JSON.stringify(field.value, null, 2)
                          }
                          onChange={(e) => handleJsonChange(e.target.value)}
                          placeholder='{"key": "value"}'
                          className="font-mono text-sm min-h-[200px]"
                        />
                        {jsonError && (
                          <p className="text-sm text-destructive">{jsonError}</p>
                        )}
                      </div>
                    )}
                  </FormControl>
                  <FormDescription>
                    {isBoolean && t("settings.booleanValue")}
                    {isNumber && t("settings.numericValue")}
                    {isString && t("settings.textValue")}
                    {!isBoolean && !isNumber && !isString && t("settings.jsonValue")}
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
                  <FormLabel>{t("settings.fieldDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder={t("settings.fieldDescriptionPlaceholder")}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("settings.fieldDescriptionDesc")}
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
              <Button type="submit" disabled={isSubmitting || !!jsonError}>
                {isSubmitting ? t("common.saving") : t("settings.updateSetting")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
