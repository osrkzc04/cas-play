import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, TextArea } from "@/shared/components";
import {
  evaluationSchema,
  type EvaluationFormValues,
} from "../schemas/evaluationSchemas";

interface EvaluationFormProps {
  defaultValues?: { title?: string; description?: string | null };
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: EvaluationFormValues) => void;
  onCancel: () => void;
}

export function EvaluationForm({
  defaultValues,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
  onCancel,
}: EvaluationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
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
        label="Título de la evaluación"
        placeholder="Ej. Evaluación del módulo"
        error={errors.title?.message}
        {...register("title")}
      />
      <TextArea
        label="Descripción (opcional)"
        placeholder="Instrucciones o contexto de la evaluación"
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
