import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, TextArea } from "@/shared/components";
import { moduleSchema, type ModuleFormValues } from "../schemas/contentSchemas";

interface ModuleFormProps {
  defaultValues?: { title?: string; description?: string | null };
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ModuleFormValues) => void;
  onCancel: () => void;
}

export function ModuleForm({
  defaultValues,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
  onCancel,
}: ModuleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Input
        label="Título del módulo"
        placeholder="Ej. Fundamentos de la cocina"
        error={errors.title?.message}
        {...register("title")}
      />
      <TextArea
        label="Descripción (opcional)"
        placeholder="Describe el contenido del módulo"
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
