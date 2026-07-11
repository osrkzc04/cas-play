import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, FieldError, StarRating, TextArea } from "@/shared/components";
import { ratingSchema, type RatingFormValues } from "../schemas/ratingSchemas";

interface RatingFormProps {
  defaultValues?: { score?: number; comment?: string | null };
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: RatingFormValues) => void;
}

export function RatingForm({
  defaultValues,
  isSubmitting = false,
  submitLabel = "Enviar valoración",
  onSubmit,
}: RatingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      score: defaultValues?.score ?? 0,
      comment: defaultValues?.comment ?? "",
    },
  });

  const score = watch("score");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="space-y-1">
        <span className="text-sm font-medium text-gray-700">
          Tu calificación
        </span>
        <StarRating
          value={score}
          size="lg"
          onChange={(value) =>
            setValue("score", value, { shouldValidate: true })
          }
        />
        <FieldError message={errors.score?.message} />
      </div>
      <TextArea
        label="Comentario (opcional)"
        placeholder="Cuéntanos tu experiencia con el curso"
        error={errors.comment?.message}
        {...register("comment")}
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
