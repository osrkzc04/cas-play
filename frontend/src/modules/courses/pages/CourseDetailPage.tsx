import { Link, useParams } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useCourse } from "../hooks/useCourses";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading, isError, error } = useCourse(courseId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !course) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
        <Link to="/courses">
          <Button variant="outline">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Link
          to="/courses"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
        <div className="flex h-56 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-300 text-6xl font-bold text-brand-700">
          {course.title.charAt(0).toUpperCase()}
        </div>
        <div className="prose max-w-none text-slate-600">
          <h2 className="text-lg font-semibold text-slate-800">
            Sobre este curso
          </h2>
          <p className="whitespace-pre-line">
            {course.description ?? "Sin descripción disponible."}
          </p>
        </div>
      </div>

      <aside>
        <Card className="space-y-4 p-6">
          <p className="text-sm text-slate-500">
            Inscríbete para acceder al contenido completo del curso.
          </p>
          <Button className="w-full" disabled>
            Inscripción próximamente
          </Button>
        </Card>
      </aside>
    </article>
  );
}
