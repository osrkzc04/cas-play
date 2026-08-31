import { Link, Navigate, useParams } from "react-router-dom";

import { Alert, Button, PageLoader } from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useCurriculum } from "@/modules/curriculum/hooks/useCurriculum";

// Punto de entrada de la vista previa del staff: resuelve la primera clase del
// curso y redirige al reproductor en modo preview. Evita que los botones "Ver
// como estudiante" necesiten conocer el id de la clase inicial.
export function CoursePreviewEntry() {
  const { courseId } = useParams<{ courseId: string }>();
  const curriculumQuery = useCurriculum(courseId);

  if (curriculumQuery.isLoading) {
    return <PageLoader />;
  }

  if (curriculumQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Alert tone="error">{getApiErrorMessage(curriculumQuery.error)}</Alert>
        <Link to={`/dashboard/courses/${courseId}/content`}>
          <Button variant="outline">Volver al contenido</Button>
        </Link>
      </div>
    );
  }

  const firstLessonId = curriculumQuery.data?.modules
    .flatMap((module) => module.lessons)
    .at(0)?.id;

  if (!firstLessonId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Alert tone="info">
          Este curso todavía no tiene clases para previsualizar. Agrega
          contenido antes de ver la vista del estudiante.
        </Alert>
        <Link to={`/dashboard/courses/${courseId}/content`}>
          <Button variant="outline">Volver al contenido</Button>
        </Link>
      </div>
    );
  }

  return (
    <Navigate
      to={`/dashboard/courses/${courseId}/preview/${firstLessonId}`}
      replace
    />
  );
}
