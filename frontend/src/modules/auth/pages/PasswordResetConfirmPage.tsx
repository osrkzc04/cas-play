import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { PasswordRequirements } from "../components/PasswordRequirements";
import { useConfirmPasswordReset } from "../hooks/useAuthMutations";
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmValues,
} from "../schemas/authSchemas";

export function PasswordResetConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // El correo enlaza a esta pantalla con el token en la query string. Si viene
  // por ese enlace lo precargamos y ocultamos el campo técnico: el usuario solo
  // define su nueva contraseña. El campo manual queda como respaldo para quien
  // abre la pantalla sin enlace ("Ya tengo un token").
  const tokenFromLink = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordResetConfirmValues>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { token: tokenFromLink },
  });

  const newPassword = watch("new_password") ?? "";

  const mutation = useConfirmPasswordReset();

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        Restablecer contraseña
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {tokenFromLink
          ? "Define tu nueva contraseña para completar la recuperación."
          : "Ingresa el token que recibiste por correo y tu nueva contraseña."}
      </p>

      {mutation.isError && (
        <Alert tone="error" className="mb-4">
          {getApiErrorMessage(mutation.error)}
        </Alert>
      )}
      {mutation.isSuccess && (
        <Alert tone="success" className="mb-4">
          {mutation.data.message}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit((values) =>
          mutation.mutate(values, {
            onSuccess: () =>
              setTimeout(() => navigate("/login", { replace: true }), 1500),
          }),
        )}
        className="flex flex-col gap-4"
        noValidate
      >
        {tokenFromLink ? (
          <input type="hidden" {...register("token")} />
        ) : (
          <Input
            label="Token de recuperación"
            error={errors.token?.message}
            {...register("token")}
          />
        )}
        <div className="flex flex-col gap-2">
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.new_password?.message}
            {...register("new_password")}
          />
          <PasswordRequirements value={newPassword} />
        </div>
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Actualizar contraseña
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    </Card>
  );
}
