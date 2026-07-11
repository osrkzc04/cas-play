import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Checkbox, Input, TextArea } from "@/shared/components";
import { lessonSchema, type LessonFormValues } from "../schemas/contentSchemas";

interface LessonFormProps {
  defaultValues?: {
    title?: string;
    description?: string | null;
    is_preview?: boolean;
  };
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: LessonFormValues) => void;
  onCancel: () => void;
}

export function LessonForm({
  defaultValues,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
  onCancel,
}: LessonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      is_preview: defaultValues?.is_preview ?? false,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Input
        label="Título de la clase"
        placeholder="Ej. Mise en place"
        error={errors.title?.message}
        {...register("title")}
      />
      <TextArea
        label="Descripción (opcional)"
        placeholder="Describe la clase"
        error={errors.description?.message}
        {...register("description")}
      />
      <Checkbox
        label="Marcar como vista previa (accesible sin inscripción)"
        {...register("is_preview")}
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
