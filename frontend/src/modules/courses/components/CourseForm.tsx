import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { TextArea } from "@/shared/components/TextArea";
import { courseSchema, type CourseFormValues } from "../schemas/courseSchema";

interface CourseFormProps {
  defaultValues?: Partial<CourseFormValues>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: CourseFormValues) => void;
}

export function CourseForm({
  defaultValues,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
}: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
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
        label="Título del curso"
        placeholder="Ej. Cocina francesa avanzada"
        error={errors.title?.message}
        {...register("title")}
      />
      <TextArea
        label="Descripción"
        placeholder="Describe el contenido y los objetivos del curso"
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
