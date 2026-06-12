import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import { useAuth } from "@/shared/auth/useAuth";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { loginSchema, type LoginFormValues } from "../schemas/authSchemas";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate(redirectTo, { replace: true }),
  });

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-slate-500">
        Accede a tu cuenta para continuar aprendiendo.
      </p>

      {loginMutation.isError && (
        <Alert tone="error" className="mb-4">
          {getApiErrorMessage(loginMutation.error)}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
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
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
          Ingresar
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link
          to="/password-reset"
          className="font-medium text-brand-600 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </Card>
  );
}
