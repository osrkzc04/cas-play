import { Link } from "react-router-dom";
import { Award, BookOpen, CheckCircle2, PlayCircle } from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageLoader,
  ProgressBar,
  StatCard,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useStudentMetrics } from "../hooks/useMetrics";

export function StudentDashboard() {
  const { data, isLoading, isError, error } = useStudentMetrics();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return <Alert tone="error">{getApiErrorMessage(error)}</Alert>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Inscritos"
          value={data.enrolled_courses}
          icon={BookOpen}
        />
        <StatCard
          label="En progreso"
          value={data.in_progress_courses}
          icon={PlayCircle}
        />
        <StatCard
          label="Completados"
          value={data.completed_courses}
          icon={CheckCircle2}
          accent="gold"
        />
        <StatCard
          label="Certificados"
          value={data.certificates_earned}
          icon={Award}
          accent="gold"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tightish text-gray-900">
          Mi aprendizaje
        </h2>

        {data.courses_breakdown.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aún no tienes cursos inscritos"
            description="Explora el catálogo y comienza a aprender hoy."
            action={
              <Link to="/courses">
                <Button>Ver catálogo</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {data.courses_breakdown.map((course) => (
              <Card
                key={course.course_id}
                className="flex flex-col gap-3 p-5 transition-shadow hover:shadow-elevated sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-gray-900">
                      {course.title}
                    </h3>
                    {course.has_certificate && (
                      <Badge tone="gold">Certificado</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {course.completed_lessons} de {course.total_lessons} clases
                    completadas
                  </p>
                  <ProgressBar
                    className="mt-2"
                    value={course.progress_percentage}
                    showValue
                  />
                </div>
                <Link to={`/courses/${course.course_id}`}>
                  <Button variant="secondary" size="sm">
                    {course.progress_percentage >= 100
                      ? "Repasar"
                      : "Continuar"}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
