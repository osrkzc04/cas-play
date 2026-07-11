import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";

import { Badge, Button, Card, Modal } from "@/shared/components";
import { cn } from "@/shared/lib/cn";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useDeleteQuestion, useUpdateQuestion } from "../hooks/useEvaluations";
import type { Question } from "../types";
import { QuestionForm } from "./QuestionForm";

interface QuestionCardProps {
  question: Question;
  index: number;
  courseId: string;
}

export function QuestionCard({ question, index, courseId }: QuestionCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useUpdateQuestion(courseId);
  const remove = useDeleteQuestion(courseId);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">{question.statement}</p>
          <Badge tone="neutral" className="mt-1">
            {question.question_type === "TRUE_FALSE"
              ? "Verdadero / Falso"
              : "Opción múltiple"}
          </Badge>
          <ul className="mt-3 space-y-1">
            {question.options.map((option) => (
              <li
                key={option.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  option.is_correct
                    ? "font-medium text-green-700"
                    : "text-gray-600",
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    option.is_correct ? "text-green-600" : "text-transparent",
                  )}
                />
                {option.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 text-brand-600" />
          </Button>
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar pregunta"
        size="lg"
      >
        <QuestionForm
          defaultValue={question}
          isSubmitting={update.isPending}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
          onSubmit={(payload) =>
            update.mutate(
              { id: question.id, payload },
              { onSuccess: () => setEditing(false) },
            )
          }
        />
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar pregunta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={remove.isPending}
              onClick={() => remove.mutate(question.id)}
            >
              Eliminar
            </Button>
          </>
        }
      >
        ¿Eliminar esta pregunta del banco?
        {remove.isError && (
          <p className="mt-2 text-sm text-brand-700">
            {getApiErrorMessage(remove.error)}
          </p>
        )}
      </Modal>
    </Card>
  );
}
