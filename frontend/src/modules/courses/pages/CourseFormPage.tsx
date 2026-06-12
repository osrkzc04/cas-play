import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Card } from "@/shared/components/Card";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { CourseForm } from "../components/CourseForm";
import {
  useCourse,
  useCreateCourse,
  useUpdateCourse,
} from "../hooks/useCourses";
import type { CourseFormValues } from "../schemas/courseSchema";

function normalizeDescription(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function CourseFormPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const isEdit = Boolean(courseId);
  const navigate = useNavigate();

  const courseQuery = useCourse(courseId);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(courseId ?? "");

  const mutation = isEdit ? updateCourse : createCourse;

  const handleSubmit = (values: CourseFormValues) => {
    const payload = {
      title: values.title,
      description: normalizeDescription(values.description),
    };

    mutation.mutate(payload, {
      onSuccess: () => navigate("/dashboard/courses"),
    });
  };

  if (isEdit && courseQuery.isLoading) {
    return <PageLoader />;
  }

  if (isEdit && (courseQuery.isError || !courseQuery.data)) {
    return <Alert tone="error">{getApiErrorMessage(courseQuery.error)}</Alert>;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? "Editar curso" : "Nuevo curso"}
        </h1>
        <p className="text-sm text-slate-500">
          {isEdit
            ? "Actualiza la información del curso."
            : "Los cursos se crean en estado borrador y se publican después."}
        </p>
      </header>

      {mutation.isError && (
        <Alert tone="error">{getApiErrorMessage(mutation.error)}</Alert>
      )}

      <Card className="p-6">
        <CourseForm
          defaultValues={{
            title: courseQuery.data?.title,
            description: courseQuery.data?.description ?? "",
          }}
          isSubmitting={mutation.isPending}
          submitLabel={isEdit ? "Guardar cambios" : "Crear curso"}
          onSubmit={handleSubmit}
        />
      </Card>
    </section>
  );
}
