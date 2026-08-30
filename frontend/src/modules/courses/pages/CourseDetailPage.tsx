import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  PlayCircle,
  Target,
  Users,
} from "lucide-react";

import { useAuth } from "@/shared/auth/useAuth";
import { Alert } from "@/shared/components/Alert";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Modal } from "@/shared/components/Modal";
import { PageLoader } from "@/shared/components/PageLoader";
import { VideoPlayer } from "@/shared/components/VideoPlayer";
import { courseLevelLabels } from "../courseLevel";
import { getApiErrorMessage } from "@/shared/lib/errors";
import {
  useEnroll,
  useEnrollmentStatus,
} from "@/modules/enrollments/hooks/useEnrollments";
import { useCurriculum } from "@/modules/curriculum/hooks/useCurriculum";
import { useCourseProgress } from "@/modules/learning/hooks/useProgress";
import { CourseRatingsSection } from "@/modules/ratings/components/CourseRatingsSection";
import { InstructorCard } from "../components/InstructorCard";
import { CertificateEligibilityCard } from "@/modules/certificates/components/CertificateEligibilityCard";
import { useCertificateEligibility } from "@/modules/certificates/hooks/useCertificates";
import { isCourseFinished } from "@/modules/certificates/types";
import { useCourse } from "../hooks/useCourses";

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === "STUDENT";

  const { data: course, isLoading, isError, error } = useCourse(courseId);
  const enrollmentQuery = useEnrollmentStatus(courseId, role);
  const enroll = useEnroll(courseId ?? "");

  const isEnrolled = enrollmentQuery.data?.is_enrolled ?? false;
  // El temario (estructura) se muestra en el catálogo a cualquier visitante;
  // el video solo es reproducible en las clases de vista previa.
  const curriculumQuery = useCurriculum(courseId);
  // Progreso del estudiante inscrito: permite reanudar en la última clase.
  const progressQuery = useCourseProgress(courseId, isStudent && isEnrolled);
  // Reutiliza la elegibilidad (misma queryKey que la tarjeta de certificado, sin
  // duplicar la petición) para marcar el curso como finalizado.
  const eligibilityQuery = useCertificateEligibility(
    courseId,
    role,
    isStudent && isEnrolled,
  );
  const isFinished = eligibilityQuery.data
    ? isCourseFinished(eligibilityQuery.data)
    : false;

  // Clase de vista previa seleccionada para reproducir en el modal.
  const [previewLesson, setPreviewLesson] = useState<{
    id: string;
    title: string;
  } | null>(null);

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

  const firstLessonId = curriculumQuery.data?.modules
    .flatMap((module) => module.lessons)
    .at(0)?.id;

  // Reanuda en la última clase con actividad; si no hay, empieza por la primera.
  const lastLessonId = progressQuery.data?.last_lesson_id ?? null;
  const resumeLessonId = lastLessonId ?? firstLessonId;
  const hasStarted = lastLessonId !== null;

  const handleEnroll = () => {
    enroll.mutate(undefined, {
      onSuccess: () => enrollmentQuery.refetch(),
    });
  };

  const goToCourse = () => {
    if (resumeLessonId) {
      navigate(`/courses/${courseId}/learn/${resumeLessonId}`);
    }
  };

  const modules = curriculumQuery.data?.modules ?? [];
  const lessonCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  const infoTopics = course.topics;

  return (
    <article className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Link
          to="/courses"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Volver al catálogo
        </Link>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isFinished && (
              <Badge tone="success" className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Finalizado
              </Badge>
            )}
            {course.level && (
              <Badge tone="gold">{courseLevelLabels[course.level]}</Badge>
            )}
            {course.duration_hours != null && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {course.duration_hours} horas
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          {course.summary && (
            <p className="text-lg text-gray-600">{course.summary}</p>
          )}
        </div>

        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="h-56 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-300 text-6xl font-bold text-brand-700">
            {course.title.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="prose max-w-none text-gray-600">
          <h2 className="text-lg font-semibold text-gray-800">
            Sobre este curso
          </h2>
          <p className="whitespace-pre-line">
            {course.description ?? "Sin descripción disponible."}
          </p>
        </div>

        {course.instructor && <InstructorCard instructor={course.instructor} />}

        {infoTopics.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Temario</h2>
            <ul className="space-y-2">
              {infoTopics.map((topic) => (
                <li
                  key={topic.id}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <Target
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold-500"
                    aria-hidden="true"
                  />
                  <span>{topic.content}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(course.requirements || course.target_audience) && (
          <section className="grid gap-4 sm:grid-cols-2">
            {course.requirements && (
              <Card className="space-y-2 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                  <BookOpen
                    className="h-4 w-4 text-brand-600"
                    aria-hidden="true"
                  />
                  Requisitos
                </h3>
                <p className="whitespace-pre-line text-sm text-gray-600">
                  {course.requirements}
                </p>
              </Card>
            )}
            {course.target_audience && (
              <Card className="space-y-2 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                  <Users className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  Dirigido a
                </h3>
                <p className="whitespace-pre-line text-sm text-gray-600">
                  {course.target_audience}
                </p>
              </Card>
            )}
          </section>
        )}

        {modules.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Contenido del curso
            </h2>
            <p className="text-sm text-gray-500">
              Puedes ver las clases marcadas como vista previa; el resto se
              desbloquea al inscribirte.
            </p>
            <ol className="space-y-3">
              {modules.map((module, index) => (
                <li key={module.id}>
                  <Card className="overflow-hidden p-0">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {index + 1}. {module.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {module.lessons.length}{" "}
                        {module.lessons.length === 1 ? "clase" : "clases"}
                      </p>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {module.lessons.map((lesson) => {
                        const playable = lesson.is_preview && lesson.has_video;
                        // Clases accesibles (vista previa): icono según el tipo,
                        // video o material. Las bloqueadas mantienen el candado.
                        const LessonIcon = !lesson.is_preview
                          ? Lock
                          : lesson.has_video
                            ? PlayCircle
                            : FileText;
                        const iconClass = !lesson.is_preview
                          ? "text-gray-300"
                          : lesson.has_video
                            ? "text-brand-600"
                            : "text-gray-400";
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <LessonIcon
                              className={`h-4 w-4 shrink-0 ${iconClass}`}
                              aria-hidden="true"
                            />
                            <span
                              className={`flex-1 truncate text-sm ${
                                playable ? "text-gray-800" : "text-gray-500"
                              }`}
                            >
                              {lesson.title}
                            </span>
                            {lesson.is_preview && (
                              <Badge tone="info">Vista previa</Badge>
                            )}
                            {playable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewLesson({
                                    id: lesson.id,
                                    title: lesson.title,
                                  })
                                }
                              >
                                <PlayCircle
                                  className="mr-1 h-4 w-4"
                                  aria-hidden="true"
                                />
                                Ver
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </li>
              ))}
            </ol>
            {curriculumQuery.data?.final_evaluation && (
              <p className="text-sm text-gray-500">
                Al finalizar, el curso incluye una evaluación final de
                aprobación que habilita el certificado.
              </p>
            )}
          </section>
        )}

        <CourseRatingsSection
          courseId={course.id}
          role={role}
          canRate={isStudent && isEnrolled}
          progressPercentage={progressQuery.data?.percentage ?? 0}
        />
      </div>

      <aside>
        <Card className="space-y-4 p-6">
          {modules.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <span>
                {modules.length}{" "}
                {modules.length === 1 ? "módulo" : "módulos"} · {lessonCount}{" "}
                {lessonCount === 1 ? "clase" : "clases"}
              </span>
            </div>
          )}

          {!isStudent && (
            <p className="text-sm text-gray-500">
              Vista previa del curso. La inscripción está disponible para
              estudiantes.
            </p>
          )}

          {isStudent && !isEnrolled && (
            <>
              <p className="text-sm text-gray-500">
                Inscríbete para acceder al contenido completo del curso.
              </p>
              {enroll.isError && (
                <Alert tone="error">{getApiErrorMessage(enroll.error)}</Alert>
              )}
              <Button
                className="w-full"
                onClick={handleEnroll}
                isLoading={enroll.isPending}
              >
                Inscribirme
              </Button>
            </>
          )}

          {isStudent && isEnrolled && (
            <>
              {isFinished ? (
                <Alert tone="success">
                  Curso finalizado. Completaste el contenido y aprobaste la
                  evaluación final.
                </Alert>
              ) : (
                <Alert tone="success">Ya estás inscrito en este curso.</Alert>
              )}
              <Button
                className="w-full"
                onClick={goToCourse}
                disabled={!resumeLessonId}
              >
                <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                {isFinished
                  ? "Repasar curso"
                  : hasStarted
                    ? "Continuar curso"
                    : "Empezar curso"}
              </Button>
            </>
          )}
        </Card>

        <div className="mt-4">
          <CertificateEligibilityCard
            courseId={course.id}
            role={role}
            enabled={isStudent && isEnrolled}
          />
        </div>
      </aside>

      <Modal
        open={previewLesson !== null}
        onClose={() => setPreviewLesson(null)}
        title={
          previewLesson ? `Vista previa · ${previewLesson.title}` : "Vista previa"
        }
        size="lg"
      >
        {previewLesson && <VideoPlayer lessonId={previewLesson.id} />}
      </Modal>
    </article>
  );
}
