import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  PageHeader,
  PageLoader,
  ProgressBar,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import {
  useAddQuestion,
  useCreateEvaluation,
  useDeleteEvaluation,
  useCourseEvaluation,
  useUpdateEvaluation,
} from "../hooks/useEvaluations";
import { QUESTION_BANK_SIZE } from "../types";
import { EvaluationForm } from "../components/EvaluationForm";
import { QuestionForm } from "../components/QuestionForm";
import { QuestionCard } from "../components/QuestionCard";

export function EvaluationManagerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const cid = courseId ?? "";

  const { data, isLoading, isError, error } = useCourseEvaluation(cid);
  const createEvaluation = useCreateEvaluation(cid);
  const updateEvaluation = useUpdateEvaluation(cid);
  const deleteEvaluation = useDeleteEvaluation(cid);
  const addQuestion = useAddQuestion(cid);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const backLink = `/dashboard/courses/${courseId}/content`;

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return <Alert tone="error">{getApiErrorMessage(error)}</Alert>;
  }

  // El curso todavía no tiene evaluación final: ofrecer crearla.
  if (!data) {
    return (
      <section className="mx-auto max-w-xl space-y-6">
        <PageHeader
          eyebrow="Evaluación final del curso"
          title="Crear evaluación"
          actions={
            <Link to={backLink}>
              <Button variant="secondary">Volver</Button>
            </Link>
          }
        />
        {createEvaluation.isError && (
          <Alert tone="error">{getApiErrorMessage(createEvaluation.error)}</Alert>
        )}
        <Card className="p-6">
          <p className="mb-4 text-sm text-gray-500">
            Este curso aún no tiene evaluación final. Crea una para empezar a
            cargar el banco de {QUESTION_BANK_SIZE} preguntas.
          </p>
          <EvaluationForm
            isSubmitting={createEvaluation.isPending}
            submitLabel="Crear evaluación"
            onCancel={() => undefined}
            onSubmit={(values) => createEvaluation.mutate(values)}
          />
        </Card>
      </section>
    );
  }

  const bankFull = data.question_count >= QUESTION_BANK_SIZE;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Evaluación final del curso"
        title={data.title}
        description={data.description ?? undefined}
        actions={
          <div className="flex gap-2">
            <Link to={backLink}>
              <Button variant="secondary">Volver</Button>
            </Link>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        }
      />

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Banco de preguntas
          </span>
          {data.is_ready ? (
            <Badge tone="success">Lista para rendirse</Badge>
          ) : (
            <Badge tone="warning">Incompleta</Badge>
          )}
        </div>
        <ProgressBar
          value={(data.question_count / QUESTION_BANK_SIZE) * 100}
        />
        <p className="text-xs text-gray-500">
          {data.question_count} de {QUESTION_BANK_SIZE} preguntas. Cada intento
          presenta 10 preguntas al azar; nota mínima 7/10.
        </p>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tightish text-gray-900">
          Preguntas
        </h2>
        <Button disabled={bankFull} onClick={() => setAddingQuestion(true)}>
          <Plus className="h-4 w-4" />
          Agregar pregunta
        </Button>
      </div>
      {bankFull && (
        <Alert tone="info">
          El banco está completo ({QUESTION_BANK_SIZE}/{QUESTION_BANK_SIZE}).
          Elimina una pregunta si deseas reemplazarla.
        </Alert>
      )}

      {data.questions.length === 0 ? (
        <Card>
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            Aún no hay preguntas. Agrega la primera.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              courseId={cid}
            />
          ))}
        </div>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar evaluación"
      >
        <EvaluationForm
          defaultValues={{ title: data.title, description: data.description }}
          isSubmitting={updateEvaluation.isPending}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            updateEvaluation.mutate(
              { id: data.id, payload: values },
              { onSuccess: () => setEditing(false) },
            )
          }
        />
      </Modal>

      <Modal
        open={addingQuestion}
        onClose={() => setAddingQuestion(false)}
        title="Nueva pregunta"
        size="lg"
      >
        <QuestionForm
          isSubmitting={addQuestion.isPending}
          submitLabel="Agregar pregunta"
          onCancel={() => setAddingQuestion(false)}
          onSubmit={(payload) =>
            addQuestion.mutate(
              { id: data.id, payload },
              { onSuccess: () => setAddingQuestion(false) },
            )
          }
        />
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar evaluación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={deleteEvaluation.isPending}
              onClick={() => deleteEvaluation.mutate(data.id)}
            >
              Eliminar
            </Button>
          </>
        }
      >
        ¿Eliminar la evaluación y todas sus preguntas?
        {deleteEvaluation.isError && (
          <p className="mt-2 text-sm text-brand-700">
            {getApiErrorMessage(deleteEvaluation.error)}
          </p>
        )}
      </Modal>
    </section>
  );
}
