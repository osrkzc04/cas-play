import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { Brand } from "@/shared/layouts/Brand";
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
    <div className="flex min-h-screen bg-surface">
      {/* Panel decorativo: fotografía institucional difuminada hacia la superficie
          de la página. Oculto en móvil/tablet para priorizar el formulario. */}
      <aside className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="/brand/front-page.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Velo oscuro fijo (no temático): en tema claro un velo `surface` blanco
            se perdería sobre la foto. Coincide con el `surface` oscuro #0f1115. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/65 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <span className="text-sm font-medium uppercase tracking-wide text-brand-600">
            Gastronomía de alto nivel
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tightish text-white">
            ¡Bienvenido de nuevo!
          </h2>
          <p className="mt-4 max-w-md text-base text-white/80">
            Inicia sesión para acceder a tus cursos y continuar aprendiendo.
          </p>
        </div>
      </aside>

      {/* Columna del formulario */}
      <main className="flex w-full flex-col lg:w-1/2">
        <div className="flex justify-end p-6">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <Brand />
            </div>
            <h1 className="mb-1 text-3xl font-bold tracking-tightish text-gray-900">
              Iniciar sesión
            </h1>
            <p className="mb-8 text-sm text-gray-500">
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
              <div className="-mt-1 text-right text-sm">
                <Link
                  to="/password-reset"
                  className="font-medium text-brand-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full"
                isLoading={loginMutation.isPending}
              >
                Ingresar
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
