import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Pencil,
  PlayCircle,
  Trash2,
  VideoOff,
} from "lucide-react";

import { Badge, Button, Modal } from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useDeleteLesson, useUpdateLesson } from "../hooks/useLessons";
import type { Lesson } from "../types";
import { LessonForm } from "./LessonForm";
import { VideoManager } from "./VideoManager";
import { MaterialsManager } from "./MaterialsManager";

interface LessonRowProps {
  lesson: Lesson;
  moduleId: string;
  index: number;
  total: number;
  onMove: (lessonId: string, direction: -1 | 1) => void;
  reordering: boolean;
}

export function LessonRow({
  lesson,
  moduleId,
  index,
  total,
  onMove,
  reordering,
}: LessonRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const update = useUpdateLesson(moduleId);
  const remove = useDeleteLesson(moduleId);

  const materialLabel =
    lesson.material_count === 1
      ? "1 material"
      : `${lesson.material_count} materiales`;

  return (
    <li className="flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800">
            <span className="truncate">{lesson.title}</span>
            {lesson.is_preview && <Badge tone="info">Vista previa</Badge>}
            {lesson.has_video ? (
              <Badge tone="success">
                <PlayCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                Video
              </Badge>
            ) : (
              <Badge tone="neutral" className="text-gray-400">
                <VideoOff className="mr-1 h-3 w-3" aria-hidden="true" />
                Sin video
              </Badge>
            )}
            <Badge tone={lesson.material_count > 0 ? "gold" : "neutral"}>
              <FileText className="mr-1 h-3 w-3" aria-hidden="true" />
              {lesson.material_count > 0 ? materialLabel : "Sin material"}
            </Badge>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === 0 || reordering}
            onClick={() => onMove(lesson.id, -1)}
            aria-label="Subir clase"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === total - 1 || reordering}
            onClick={() => onMove(lesson.id, 1)}
            aria-label="Bajar clase"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={expanded ? "secondary" : "outline"}
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            Contenido
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Editar clase"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eliminar clase"
          >
            <Trash2 className="h-4 w-4 text-brand-600" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-gray-100 bg-gray-50/60 px-4 py-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Video de la clase
            </h4>
            <VideoManager lesson={lesson} moduleId={moduleId} />
          </div>
          <div className="border-t border-gray-200 pt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Materiales
            </h4>
            <MaterialsManager lessonId={lesson.id} moduleId={moduleId} />
          </div>
        </div>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar clase"
      >
        <LessonForm
          defaultValues={{
            title: lesson.title,
            description: lesson.description,
            is_preview: lesson.is_preview,
          }}
          isSubmitting={update.isPending}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            update.mutate(
              { id: lesson.id, payload: values },
              { onSuccess: () => setEditing(false) },
            )
          }
        />
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar clase"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={remove.isPending}
              onClick={() => remove.mutate(lesson.id)}
            >
              Eliminar
            </Button>
          </>
        }
      >
        ¿Eliminar la clase "{lesson.title}"? Se eliminarán su video y materiales.
        {remove.isError && (
          <p className="mt-2 text-sm text-brand-700">
            {getApiErrorMessage(remove.error)}
          </p>
        )}
      </Modal>
    </li>
  );
}
