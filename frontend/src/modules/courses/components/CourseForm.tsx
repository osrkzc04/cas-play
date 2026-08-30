import { useEffect, useRef, useState } from "react";
import {
  useForm,
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Select } from "@/shared/components/Select";
import { TextArea } from "@/shared/components/TextArea";
import { FieldError } from "@/shared/components/FieldError";
import { UnsavedChangesPrompt } from "@/shared/components/UnsavedChangesPrompt";
import { courseLevelOptions } from "../courseLevel";
import { courseSchema, type CourseFormValues } from "../schemas/courseSchema";

const MAX_COVER_MB = 5;
const ACCEPTED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface CourseFormProps {
  defaultValues?: Partial<CourseFormValues>;
  currentCoverUrl?: string | null;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: CourseFormValues, coverFile: File | null) => void;
}

type ItemErrors = Array<{ content?: { message?: string } } | undefined>;

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

interface TopicListProps {
  control: Control<CourseFormValues>;
  register: UseFormRegister<CourseFormValues>;
  placeholder: string;
  addLabel: string;
  itemErrors?: ItemErrors;
}

function TopicListEditor({
  control,
  register,
  placeholder,
  addLabel,
  itemErrors,
}: TopicListProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "topics" });

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-3 py-5 text-center text-sm text-gray-400">
          Aún no has agregado temas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex items-center gap-3 rounded-lg bg-gray-50/60 px-3 py-2"
            >
              <span className="w-5 shrink-0 text-center text-sm font-semibold text-gray-400">
                {index + 1}
              </span>
              <div className="flex-1">
                <Input
                  className="w-full bg-card px-4 py-2"
                  placeholder={placeholder}
                  error={itemErrors?.[index]?.content?.message}
                  {...register(`topics.${index}.content`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 w-11 shrink-0 px-0 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                onClick={() => remove(index)}
                aria-label={`Eliminar tema ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ content: "" })}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

interface CoverUploaderProps {
  currentCoverUrl?: string | null;
  onSelect: (file: File | null) => void;
}

function CoverUploader({ currentCoverUrl, onSelect }: CoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentCoverUrl ?? null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Libera el object URL local al desmontar o al reemplazar la imagen.
  useEffect(() => {
    return () => {
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [localUrl]);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) {
      return;
    }
    if (!ACCEPTED_COVER_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_COVER_MB * 1024 * 1024) {
      setError(`La imagen supera ${MAX_COVER_MB} MB.`);
      return;
    }
    if (localUrl) {
      URL.revokeObjectURL(localUrl);
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    setPreview(url);
    onSelect(file);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-32 w-full max-w-xs items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
        {preview ? (
          <img
            src={preview}
            alt="Vista previa de la portada"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs">Sin portada</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_COVER_TYPES.join(",")}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
          {preview ? "Cambiar imagen" : "Subir imagen"}
        </Button>
        <p className="text-xs text-gray-400">
          JPG, PNG o WEBP · máx. {MAX_COVER_MB} MB
        </p>
        <FieldError message={error ?? undefined} />
      </div>
    </div>
  );
}

export function CourseForm({
  defaultValues,
  currentCoverUrl,
  isSubmitting = false,
  submitLabel = "Guardar",
  onSubmit,
}: CourseFormProps) {
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      summary: defaultValues?.summary ?? "",
      description: defaultValues?.description ?? "",
      level: defaultValues?.level ?? "",
      duration_hours: defaultValues?.duration_hours ?? "",
      requirements: defaultValues?.requirements ?? "",
      target_audience: defaultValues?.target_audience ?? "",
      topics: defaultValues?.topics ?? [],
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values, coverFile))}
      className="flex flex-col gap-6"
      noValidate
    >
      <UnsavedChangesPrompt
        when={(isDirty || coverFile !== null) && !isSubmitting}
      />
      <FormSection title="Información general">
        <Input
          label="Título del curso"
          placeholder="Ej. Fundamentos de Cocina Profesional"
          error={errors.title?.message}
          {...register("title")}
        />
        <Input
          label="Resumen corto"
          placeholder="Frase que describa el curso en el catálogo"
          error={errors.summary?.message}
          {...register("summary")}
        />
        <TextArea
          label="Descripción"
          placeholder="Describe de qué trata el curso"
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Nivel"
            placeholder="Sin especificar"
            options={courseLevelOptions}
            error={errors.level?.message}
            {...register("level")}
          />
          <Input
            type="number"
            min={0}
            label="Duración estimada (horas)"
            placeholder="Ej. 12"
            error={errors.duration_hours?.message}
            {...register("duration_hours")}
          />
        </div>
      </FormSection>

      <FormSection
        title="Portada"
        description="Imagen que se muestra en el catálogo y la página del curso."
      >
        <CoverUploader
          currentCoverUrl={currentCoverUrl}
          onSelect={setCoverFile}
        />
      </FormSection>

      <FormSection title="Detalle">
        <TextArea
          label="Requisitos previos"
          placeholder="Qué necesita saber o tener el estudiante antes de empezar"
          error={errors.requirements?.message}
          {...register("requirements")}
        />
        <TextArea
          label="Dirigido a"
          placeholder="A qué público está orientado el curso"
          error={errors.target_audience?.message}
          {...register("target_audience")}
        />
      </FormSection>

      <FormSection
        title="Temario"
        description="Lista informativa de temas, visible antes de inscribirse."
      >
        <TopicListEditor
          control={control}
          register={register}
          placeholder="Ej. Fondos y caldos base"
          addLabel="Agregar tema"
          itemErrors={errors.topics as unknown as ItemErrors}
        />
        <FieldError message={errors.topics?.message} />
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
