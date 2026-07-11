import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/shared/auth/useAuth";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useChangePassword } from "../hooks/useAuthMutations";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "../schemas/authSchemas";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const mutation = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const isForced = Boolean(user?.must_change_password);

  const onSubmit = (values: ChangePasswordValues) => {
    mutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        onSuccess: async () => {
          // Recarga /me para limpiar must_change_password y liberar las rutas.
          await refreshUser();
          navigate("/dashboard", { replace: true });
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          Cambiar contraseña
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {isForced
            ? "Por seguridad, debes definir una nueva contraseña antes de continuar."
            : "Actualiza tu contraseña de acceso."}
        </p>

        {mutation.isError && (
          <Alert tone="error" className="mb-4">
            {getApiErrorMessage(mutation.error)}
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            error={errors.current_password?.message}
            {...register("current_password")}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.new_password?.message}
            {...register("new_password")}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirm_password?.message}
            {...register("confirm_password")}
          />
          <Button type="submit" className="w-full" isLoading={mutation.isPending}>
            Actualizar contraseña
          </Button>
        </form>
      </Card>
    </div>
  );
}
