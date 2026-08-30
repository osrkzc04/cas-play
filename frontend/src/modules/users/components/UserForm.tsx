import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Select } from "@/shared/components/Select";
import { UnsavedChangesPrompt } from "@/shared/components/UnsavedChangesPrompt";
import { getRoleLabel } from "@/shared/auth/roles";
import {
  createUserSchema,
  editUserSchema,
} from "../schemas/userSchemas";
import type { UserRole } from "../types";

const schemaByMode = {
  create: createUserSchema,
  edit: editUserSchema,
};

export type UserFormValues = z.infer<typeof createUserSchema> & {
  is_active?: boolean;
};

interface UserFormProps {
  mode: "create" | "edit";
  roles: UserRole[];
  defaultValues?: Partial<UserFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: UserFormValues) => void;
}

export function UserForm({
  mode,
  roles,
  defaultValues,
  isSubmitting = false,
  onSubmit,
}: UserFormProps) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schemaByMode[mode]),
    defaultValues: {
      first_name: defaultValues?.first_name ?? "",
      last_name: defaultValues?.last_name ?? "",
      email: defaultValues?.email ?? "",
      role_id: defaultValues?.role_id ?? "",
      is_active: defaultValues?.is_active ?? true,
    },
  });

  // BR-036: los estudiantes se dan de alta al matricularlos, no desde aquí.
  // Se oculta el rol STUDENT al crear; en edición solo se conserva para mostrar
  // el rol actual de quien ya es estudiante.
  const roleOptions = roles
    .filter((role) =>
      role.name === "STUDENT"
        ? isEdit && role.id === defaultValues?.role_id
        : true,
    )
    .map((role) => ({
      value: role.id,
      label: getRoleLabel(role.name),
    }));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <UnsavedChangesPrompt when={isDirty && !isSubmitting} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          error={errors.first_name?.message}
          {...register("first_name")}
        />
        <Input
          label="Apellido"
          error={errors.last_name?.message}
          {...register("last_name")}
        />
      </div>
      <Input
        label="Correo electrónico"
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      {!isEdit && (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
          Se generará una contraseña temporal y se enviará al correo indicado. El
          usuario deberá cambiarla en su primer ingreso.
        </p>
      )}
      <Select
        label="Rol"
        placeholder="Selecciona un rol"
        options={roleOptions}
        error={errors.role_id?.message}
        {...register("role_id")}
      />
      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("is_active")} />
          Usuario activo
        </label>
      )}
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
