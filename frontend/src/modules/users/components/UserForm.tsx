import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Select } from "@/shared/components/Select";
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
    formState: { errors },
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

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
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
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
      )}
      <Select
        label="Rol"
        placeholder="Selecciona un rol"
        options={roleOptions}
        error={errors.role_id?.message}
        {...register("role_id")}
      />
      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
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
