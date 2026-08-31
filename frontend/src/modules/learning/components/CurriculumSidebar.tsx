import { Link } from "react-router-dom";
import { CheckCircle2, Circle, FileText, PlayCircle } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import type {
  CurriculumEvaluation,
  CurriculumModule,
} from "@/modules/curriculum/types";

interface CurriculumSidebarProps {
  courseId: string;
  modules: CurriculumModule[];
  finalEvaluation: CurriculumEvaluation | null;
  currentLessonId: string | undefined;
  completedLessonIds: Set<string>;
  // Ruta base de las clases; difiere en la vista previa del staff.
  lessonBasePath?: string;
  // La vista previa del staff no incluye el intento de evaluación final.
  hideExam?: boolean;
}

export function CurriculumSidebar({
  courseId,
  modules,
  finalEvaluation,
  currentLessonId,
  completedLessonIds,
  lessonBasePath = `/courses/${courseId}/learn`,
  hideExam = false,
}: CurriculumSidebarProps) {
  return (
    <nav className="space-y-5">
      {modules.map((module, index) => (
        <div key={module.id} className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">
            {index + 1}. {module.title}
          </p>
          <ul className="space-y-1">
            {module.lessons.map((lesson) => {
              const isActive = lesson.id === currentLessonId;
              const isCompleted = completedLessonIds.has(lesson.id);
              // El icono refleja el tipo de clase: video o material/documento.
              const TypeIcon = lesson.has_video ? PlayCircle : FileText;
              return (
                <li key={lesson.id}>
                  <Link
                    to={`${lessonBasePath}/${lesson.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isCompleted ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-green-600"
                        aria-label="Completada"
                      />
                    ) : (
                      <Circle
                        className="h-4 w-4 shrink-0 text-gray-300"
                        aria-hidden="true"
                      />
                    )}
                    <TypeIcon
                      className="h-4 w-4 shrink-0 text-gray-400"
                      aria-label={lesson.has_video ? "Clase en video" : "Clase con material"}
                    />
                    <span className="line-clamp-2">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {finalEvaluation && !hideExam && (
        <div className="border-t border-gray-200 pt-4">
          <Link
            to={`/courses/${courseId}/exam`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FileText
              className="h-4 w-4 shrink-0 text-gold-500"
              aria-hidden="true"
            />
            <span>Evaluación final del curso</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
