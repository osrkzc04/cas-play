import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

import { Button, FieldError, Input, Select, TextArea } from "@/shared/components";
import {
  questionSchema,
  type QuestionFormValues,
} from "../schemas/evaluationSchemas";
import type { Question, QuestionPayload, QuestionType } from "../types";

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;
const TF_OPTIONS = [{ text: "Verdadero" }, { text: "Falso" }];

interface QuestionFormProps {
  defaultValue?: Question;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (payload: QuestionPayload) => void;
  onCancel: () => void;
}

export function QuestionForm({
  defaultValue,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      statement: defaultValue?.statement ?? "",
      question_type: defaultValue?.question_type ?? "MULTIPLE_CHOICE",
      options: defaultValue?.options.map((o) => ({ text: o.text })) ?? [
        { text: "" },
        { text: "" },
      ],
      correctIndex: Math.max(
        0,
        defaultValue?.options.findIndex((o) => o.is_correct) ?? 0,
      ),
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "options",
  });
  const type = watch("question_type");
  const correctIndex = watch("correctIndex");
  const isTrueFalse = type === "TRUE_FALSE";

  const changeType = (next: QuestionType) => {
    setValue("question_type", next);
    setValue("correctIndex", 0);
    replace(next === "TRUE_FALSE" ? TF_OPTIONS : [{ text: "" }, { text: "" }]);
  };

  const removeOption = (index: number) => {
    if (fields.length <= MIN_OPTIONS) {
      return;
    }
    remove(index);
    // Reubica la marca de correcta si se elimina antes o sobre ella.
    if (correctIndex === index) {
      setValue("correctIndex", 0);
    } else if (correctIndex > index) {
      setValue("correctIndex", correctIndex - 1);
    }
  };

  const submit = (values: QuestionFormValues) => {
    onSubmit({
      statement: values.statement.trim(),
      question_type: values.question_type,
      options: values.options.map((option, index) => ({
        text: option.text.trim(),
        is_correct: index === values.correctIndex,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <TextArea
        label="Enunciado"
        placeholder="Escribe la pregunta"
        className="min-h-[80px]"
        error={errors.statement?.message}
        {...register("statement")}
      />

      <Select
        label="Tipo de pregunta"
        options={[
          { value: "MULTIPLE_CHOICE", label: "Opción múltiple" },
          { value: "TRUE_FALSE", label: "Verdadero / Falso" },
        ]}
        value={type}
        onChange={(event) => changeType(event.target.value as QuestionType)}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-gray-700">
          Opciones (marca la correcta)
        </legend>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctIndex"
              checked={correctIndex === index}
              onChange={() => setValue("correctIndex", index)}
              className="h-4 w-4 accent-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label={`Marcar opción ${index + 1} como correcta`}
            />
            <div className="flex-1">
              <Input
                disabled={isTrueFalse}
                placeholder={`Opción ${index + 1}`}
                error={errors.options?.[index]?.text?.message}
                {...register(`options.${index}.text`)}
              />
            </div>
            {!isTrueFalse && fields.length > MIN_OPTIONS && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                aria-label={`Quitar opción ${index + 1}`}
              >
                <Trash2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        <FieldError message={errors.correctIndex?.message} />
        {!isTrueFalse && fields.length < MAX_OPTIONS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => append({ text: "" })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar opción
          </Button>
        )}
      </fieldset>

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
