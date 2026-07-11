import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useRequestPasswordReset } from "../hooks/useAuthMutations";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestValues,
} from "../schemas/authSchemas";

export function PasswordResetRequestPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const mutation = useRequestPasswordReset();

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        Recuperar contraseña
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Te enviaremos las instrucciones para restablecer tu contraseña.
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
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" className="w-full" isLoading={mutation.isPending}>
          Enviar instrucciones
        </Button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Volver a iniciar sesión
        </Link>
        <Link
          to="/password-reset/confirm"
          className="font-medium text-brand-600 hover:underline"
        >
          Ya tengo un token
        </Link>
      </div>
    </Card>
  );
}
