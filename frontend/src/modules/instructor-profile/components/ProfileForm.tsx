import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Camera, Video } from "lucide-react";

import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { TextArea } from "@/shared/components/TextArea";
import { UnsavedChangesPrompt } from "@/shared/components/UnsavedChangesPrompt";
import {
  instructorProfileSchema,
  type InstructorProfileFormValues,
} from "../schemas/profileSchemas";

interface ProfileFormProps {
  defaultValues?: Partial<InstructorProfileFormValues>;
  isSubmitting?: boolean;
  // Al guardarse con éxito, el formulario se "limpia" (isDirty -> false) para
  // que el guardián de cambios sin guardar no se dispare al navegar.
  saveSucceeded?: boolean;
  onSubmit: (values: InstructorProfileFormValues) => void;
}

export function ProfileForm({
  defaultValues,
  isSubmitting = false,
  saveSucceeded = false,
  onSubmit,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm<InstructorProfileFormValues>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: {
      headline: defaultValues?.headline ?? "",
      specialty: defaultValues?.specialty ?? "",
      about_me: defaultValues?.about_me ?? "",
      linkedin: defaultValues?.linkedin ?? "",
      instagram: defaultValues?.instagram ?? "",
      youtube: defaultValues?.youtube ?? "",
    },
  });

  // Reancla los valores por defecto a los recién guardados: isDirty vuelve a
  // false sin alterar lo que ve el usuario.
  useEffect(() => {
    if (saveSucceeded) {
      reset(getValues());
    }
  }, [saveSucceeded, reset, getValues]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <UnsavedChangesPrompt when={isDirty && !isSubmitting} />
      <Input
        label="Titular"
        placeholder="Ej. Chef pastelera · 10 años de experiencia"
        error={errors.headline?.message}
        {...register("headline")}
      />
      <Input
        label="Especialidad culinaria"
        placeholder="Ej. Pastelería francesa"
        error={errors.specialty?.message}
        {...register("specialty")}
      />
      <TextArea
        label="Sobre mí"
        placeholder="Cuenta tu trayectoria, formación y experiencia docente."
        className="min-h-[160px]"
        error={errors.about_me?.message}
        {...register("about_me")}
      />

      <fieldset className="flex flex-col gap-4 border-t border-gray-100 pt-5">
        <legend className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Redes sociales
        </legend>
        <div className="flex items-end gap-3">
          <Briefcase
            className="mb-3 h-5 w-5 shrink-0 text-gray-400"
            aria-hidden="true"
          />
          <div className="flex-1">
            <Input
              label="LinkedIn"
              type="url"
              inputMode="url"
              placeholder="https://www.linkedin.com/in/tu-perfil"
              error={errors.linkedin?.message}
              {...register("linkedin")}
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <Camera
            className="mb-3 h-5 w-5 shrink-0 text-gray-400"
            aria-hidden="true"
          />
          <div className="flex-1">
            <Input
              label="Instagram"
              type="url"
              inputMode="url"
              placeholder="https://www.instagram.com/tu-usuario"
              error={errors.instagram?.message}
              {...register("instagram")}
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <Video
            className="mb-3 h-5 w-5 shrink-0 text-gray-400"
            aria-hidden="true"
          />
          <div className="flex-1">
            <Input
              label="YouTube"
              type="url"
              inputMode="url"
              placeholder="https://www.youtube.com/@tu-canal"
              error={errors.youtube?.message}
              {...register("youtube")}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
