import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  PageLoader,
  ProgressBar,
  VideoPlayer,
} from "@/shared/components";
import { cn } from "@/shared/lib/cn";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useAuth } from "@/shared/auth/useAuth";
import { useCurriculum } from "@/modules/curriculum/hooks/useCurriculum";
import { useCourse } from "@/modules/courses/hooks/useCourses";
import { useCertificateEligibility } from "@/modules/certificates/hooks/useCertificates";
import { isCourseFinished } from "@/modules/certificates/types";
import { CurriculumSidebar } from "../components/CurriculumSidebar";
import { LessonMaterials } from "../components/LessonMaterials";
import { NoVideoPlaceholder } from "../components/NoVideoPlaceholder";
import {
  useCompleteLesson,
  useCourseProgress,
  useSaveLastSecond,
} from "../hooks/useProgress";

export function LearnPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();

  const [wide, setWide] = useState(false);
  const materialsAnchorId = "lesson-materials";

  const { user } = useAuth();
  const courseQuery = useCourse(courseId);
  const curriculumQuery = useCurriculum(courseId);
  const progressQuery = useCourseProgress(courseId);
  const eligibilityQuery = useCertificateEligibility(courseId, user?.role);
  const isFinished = eligibilityQuery.data
    ? isCourseFinished(eligibilityQuery.data)
    : false;

  const saveLastSecond = useSaveLastSecond();
  const completeLesson = useCompleteLesson(courseId ?? "");

  const modules = useMemo(
    () => curriculumQuery.data?.modules ?? [],
    [curriculumQuery.data],
  );
  const flatLessons = useMemo(
    () => modules.flatMap((module) => module.lessons),
    [modules],
  );

  const currentLesson = flatLessons.find((lesson) => lesson.id === lessonId);
  const currentIndex = flatLessons.findIndex((lesson) => lesson.id === lessonId);
  const prevLesson =
    currentIndex > 0 ? flatLessons[currentIndex - 1] : undefined;
  const nextLesson =
    currentIndex >= 0 ? flatLessons[currentIndex + 1] : undefined;

  const completedLessonIds = useMemo(
    () =>
      new Set(
        (progressQuery.data?.lessons ?? [])
          .filter((lesson) => lesson.is_completed)
          .map((lesson) => lesson.lesson_id),
      ),
    [progressQuery.data],
  );

  const lessonProgress = progressQuery.data?.lessons.find(
    (lesson) => lesson.lesson_id === lessonId,
  );
  const isCompleted = lessonId ? completedLessonIds.has(lessonId) : false;

  if (curriculumQuery.isLoading || courseQuery.isLoading) {
    return <PageLoader />;
  }

  if (curriculumQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Alert tone="error">{getApiErrorMessage(curriculumQuery.error)}</Alert>
        <Link to={`/courses/${courseId}`}>
          <Button variant="outline">Volver al curso</Button>
        </Link>
      </div>
    );
  }

  const goToLesson = (id: string) =>
    navigate(`/courses/${courseId}/learn/${id}`);

  const handleComplete = () => {
    if (!lessonId) {
      return;
    }
    completeLesson.mutate(lessonId, {
      onSuccess: () => {
        if (nextLesson) {
          goToLesson(nextLesson.id);
        }
      },
    });
  };

  const percentage = progressQuery.data?.percentage ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to={`/courses/${courseId}`}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {courseQuery.data?.title ?? "Volver al curso"}
          </Link>
          <div className="flex items-center gap-4">
            {isFinished && (
              <Badge tone="success" className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Curso finalizado
              </Badge>
            )}
            <div className="hidden w-48 items-center gap-2 sm:flex">
              <ProgressBar value={percentage} className="flex-1" />
              <span className="text-xs font-medium text-gray-500">
                {Math.round(percentage)}%
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWide((v) => !v)}
              aria-pressed={wide}
            >
              {wide ? (
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {wide ? "Vista normal" : "Vista ampliada"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-6 px-4 py-6",
          !wide && "lg:grid-cols-[1fr_320px]",
        )}
      >
        <main className="space-y-5">
          {isFinished && (
            <Alert tone="success">
              ¡Felicitaciones! Completaste el contenido y aprobaste la
              evaluación final de este curso.
            </Alert>
          )}
          <div className="relative">
            {currentLesson?.has_video ? (
              <VideoPlayer
                lessonId={currentLesson.id}
                initialSecond={lessonProgress?.last_second ?? 0}
                onSaveProgress={(second) =>
                  lessonId &&
                  saveLastSecond.mutate({ lessonId, lastSecond: second })
                }
                onEnded={() =>
                  lessonId && !isCompleted && completeLesson.mutate(lessonId)
                }
              />
            ) : (
              lessonId && (
                <NoVideoPlaceholder
                  lessonId={lessonId}
                  materialsAnchorId={materialsAnchorId}
                />
              )
            )}

            {prevLesson && (
              <button
                type="button"
                onClick={() => goToLesson(prevLesson.id)}
                aria-label="Clase anterior"
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            {nextLesson && (
              <button
                type="button"
                onClick={() => goToLesson(nextLesson.id)}
                aria-label="Clase siguiente"
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentLesson?.title ?? "Clase"}
            </h1>
            {currentLesson?.description && (
              <p className="whitespace-pre-line text-gray-600">
                {currentLesson.description}
              </p>
            )}
          </div>

          {completeLesson.isError && (
            <Alert tone="error">{getApiErrorMessage(completeLesson.error)}</Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => prevLesson && goToLesson(prevLesson.id)}
              disabled={!prevLesson}
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Anterior
            </Button>

            {isCompleted ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Clase completada
              </span>
            ) : (
              <Button
                onClick={handleComplete}
                isLoading={completeLesson.isPending}
              >
                Marcar como completada
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => nextLesson && goToLesson(nextLesson.id)}
              disabled={!nextLesson}
            >
              Siguiente clase
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {lessonId && (
            <div id={materialsAnchorId} className="scroll-mt-6">
              <LessonMaterials lessonId={lessonId} />
            </div>
          )}
        </main>

        {!wide && (
          <aside className="lg:border-l lg:border-gray-200 lg:pl-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Contenido del curso
            </h2>
            <CurriculumSidebar
              courseId={courseId ?? ""}
              modules={modules}
              finalEvaluation={curriculumQuery.data?.final_evaluation ?? null}
              currentLessonId={lessonId}
              completedLessonIds={completedLessonIds}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
