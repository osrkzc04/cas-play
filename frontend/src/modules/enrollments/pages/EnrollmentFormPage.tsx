import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useManagedCourses } from "@/modules/courses/hooks/useCourses";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Input } from "@/shared/components/Input";
import { Select } from "@/shared/components/Select";
import { getApiErrorMessage } from "@/shared/lib/errors";
import {
  adminEnrollmentSchema,
  type AdminEnrollmentValues,
} from "../schemas/enrollmentSchemas";
import { enrollmentService } from "../services/enrollmentService";
import { useCreateAdminEnrollment } from "../hooks/useEnrollments";
import type { AdminEnrollmentResult, UserLookup } from "../types";

export function EnrollmentFormPage() {
  const coursesQuery = useManagedCourses(1, 100, "PUBLISHED");
  const createEnrollment = useCreateAdminEnrollment();

  const [lookup, setLookup] = useState<UserLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminEnrollmentResult | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<AdminEnrollmentValues>({
    resolver: zodResolver(adminEnrollmentSchema),
    defaultValues: { email: "", course_id: "", first_name: "", last_name: "" },
  });

  // El alta de usuario depende de si el correo ya existe; por eso la búsqueda
  // se resuelve en el servidor antes de habilitar el resto del formulario.
  const verifyEmail = async () => {
    const email = getValues("email").trim();

    if (!email) {
      setError("email", { message: "Ingresa un correo válido" });
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setResult(null);

    try {
      setLookup(await enrollmentService.lookupUser(email));
    } catch (error) {
      setLookupError(getApiErrorMessage(error));
      setLookup(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const isNewUser = lookup !== null && !lookup.exists;

  const onSubmit = (values: AdminEnrollmentValues) => {
    if (lookup === null) {
      setLookupError("Verifica el correo antes de matricular");
      return;
    }

    if (isNewUser && (!values.first_name || !values.last_name)) {
      if (!values.first_name) {
        setError("first_name", { message: "El nombre es obligatorio" });
      }
      if (!values.last_name) {
        setError("last_name", { message: "El apellido es obligatorio" });
      }
      return;
    }

    createEnrollment.mutate(
      {
        email: values.email.trim(),
        course_id: values.course_id,
        first_name: isNewUser ? values.first_name : undefined,
        last_name: isNewUser ? values.last_name : undefined,
      },
      {
        onSuccess: (data) => setResult(data),
      },
    );
  };

  const courseOptions = (coursesQuery.data?.items ?? []).map((course) => ({
    value: course.id,
    label: course.title,
  }));

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nueva matrícula</h1>
        <Link to="/dashboard/enrollments">
          <Button variant="outline" size="sm">
            Volver
          </Button>
        </Link>
      </header>

      {result && (
        <Alert tone="success">
          Matrícula registrada correctamente.
          {result.user_created
            ? " Se creó el usuario y se envió un correo con las credenciales de acceso temporales."
            : ""}
        </Alert>
      )}

      {createEnrollment.isError && (
        <Alert tone="error">{getApiErrorMessage(createEnrollment.error)}</Alert>
      )}

      <Card className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Correo del estudiante"
                type="email"
                error={errors.email?.message}
                {...register("email", {
                  onChange: () => {
                    setLookup(null);
                    setResult(null);
                  },
                })}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              isLoading={lookupLoading}
              onClick={verifyEmail}
            >
              Verificar
            </Button>
          </div>

          {lookupError && <Alert tone="error">{lookupError}</Alert>}

          {lookup?.exists && lookup.user && (
            <Alert tone="info">
              Usuario existente: {lookup.user.first_name}{" "}
              {lookup.user.last_name} ({lookup.user.email}).
            </Alert>
          )}

          {isNewUser && (
            <>
              <Alert tone="info">
                El correo no está registrado: se creará un usuario nuevo con
                contraseña temporal.
              </Alert>
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
            </>
          )}

          <Select
            label="Curso"
            placeholder="Selecciona un curso"
            options={courseOptions}
            error={errors.course_id?.message}
            {...register("course_id")}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={createEnrollment.isPending}
              disabled={lookup === null}
            >
              Matricular
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
