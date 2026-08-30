import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button, Card, Modal, Spinner } from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useDeleteModule, useUpdateModule } from "../hooks/useModules";
import {
  useCreateLesson,
  useLessons,
  useReorderLessons,
} from "../hooks/useLessons";
import type { Module } from "../types";
import { ModuleForm } from "./ModuleForm";
import { LessonForm } from "./LessonForm";
import { LessonRow } from "./LessonRow";

interface ModuleCardProps {
  module: Module;
  index: number;
  total: number;
  onMove: (moduleId: string, direction: -1 | 1) => void;
  reordering: boolean;
}

export function ModuleCard({
  module,
  index,
  total,
  onMove,
  reordering,
}: ModuleCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);

  const update = useUpdateModule(module.course_id);
  const remove = useDeleteModule(module.course_id);

  const lessonsQuery = useLessons(module.id);
  const createLesson = useCreateLesson(module.id);
  const reorderLessons = useReorderLessons(module.id);

  const lessons = lessonsQuery.data ?? [];

  const lessonCount = lessons.length;
  const withVideo = lessons.filter((l) => l.has_video).length;
  const materialCount = lessons.reduce((sum, l) => sum + l.material_count, 0);
  const summary =
    lessonCount === 0
      ? "Sin clases aún"
      : `${lessonCount} ${lessonCount === 1 ? "clase" : "clases"} · ` +
        `${withVideo} con video · ${materialCount} ` +
        `${materialCount === 1 ? "material" : "materiales"}`;

  const moveLesson = (lessonId: string, direction: -1 | 1) => {
    const ids = lessons.map((l) => l.id);
    const i = ids.indexOf(lessonId);
    const j = i + direction;
    if (j < 0 || j >= ids.length) {
      return;
    }
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderLessons.mutate(ids);
  };

  return (
    <Card>
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">
            {module.title}
          </h3>
          {!lessonsQuery.isLoading && (
            <p className="text-xs text-gray-400">{summary}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === 0 || reordering}
            onClick={() => onMove(module.id, -1)}
            aria-label="Subir módulo"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === total - 1 || reordering}
            onClick={() => onMove(module.id, 1)}
            aria-label="Bajar módulo"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Editar módulo"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eliminar módulo"
          >
            <Trash2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {module.description && (
        <p className="px-4 pt-3 text-sm text-gray-500">{module.description}</p>
      )}

      {lessonsQuery.isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : lessons.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          Este módulo aún no tiene clases.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {lessons.map((lesson, i) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              moduleId={module.id}
              index={i}
              total={lessons.length}
              onMove={moveLesson}
              reordering={reorderLessons.isPending}
            />
          ))}
        </ul>
      )}

      <div className="border-t border-gray-200 px-4 py-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAddingLesson(true)}
        >
          <Plus className="h-4 w-4" />
          Agregar clase
        </Button>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar módulo">
        <ModuleForm
          defaultValues={{ title: module.title, description: module.description }}
          isSubmitting={update.isPending}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            update.mutate(
              { id: module.id, payload: values },
              { onSuccess: () => setEditing(false) },
            )
          }
        />
      </Modal>

      <Modal
        open={addingLesson}
        onClose={() => setAddingLesson(false)}
        title="Nueva clase"
      >
        <LessonForm
          isSubmitting={createLesson.isPending}
          submitLabel="Crear clase"
          onCancel={() => setAddingLesson(false)}
          onSubmit={(values) =>
            createLesson.mutate(values, {
              onSuccess: () => setAddingLesson(false),
            })
          }
        />
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar módulo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={remove.isPending}
              onClick={() => remove.mutate(module.id)}
            >
              Eliminar
            </Button>
          </>
        }
      >
        ¿Eliminar el módulo "{module.title}"? Se eliminarán sus clases,
        videos y materiales.
        {remove.isError && (
          <p className="mt-2 text-sm text-brand-700">
            {getApiErrorMessage(remove.error)}
          </p>
        )}
      </Modal>
    </Card>
  );
}
