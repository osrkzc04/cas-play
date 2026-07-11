import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  PageLoader,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useCurriculum } from "@/modules/curriculum/hooks/useCurriculum";
import { AttemptQuestionCard } from "../components/AttemptQuestionCard";
import {
  useMyAttempts,
  useReviewAttempt,
  useStartAttempt,
  useSubmitAttempt,
} from "../hooks/useAttempts";
import {
  MAX_ATTEMPTS,
  PASSING_SCORE,
  type AttemptDetail,
} from "../types";

type Mode = "intro" | "taking" | "result";

export function EvaluationAttemptPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const [mode, setMode] = useState<Mode>("intro");
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const curriculumQuery = useCurriculum(courseId);
  const evaluation = curriculumQuery.data?.final_evaluation ?? null;
  const evaluationId = evaluation?.id;

  const attemptsQuery = useMyAttempts(evaluationId);
  const startAttempt = useStartAttempt(evaluationId ?? "");
  const submitAttempt = useSubmitAttempt(evaluationId ?? "");
  const reviewAttempt = useReviewAttempt();

  const previousAttempts = attemptsQuery.data ?? [];
  const usedAttempts = previousAttempts.length;
  const hasPassed = previousAttempts.some((a) => a.passed);
  const remaining = Math.max(0, MAX_ATTEMPTS - usedAttempts);
  const canStart = !hasPassed && remaining > 0;

  const backLink = `/courses/${courseId}/learn/${
    curriculumQuery.data?.modules[0]?.lessons[0]?.id ?? ""
  }`;

  if (curriculumQuery.isLoading || attemptsQuery.isLoading) {
    return <PageLoader />;
  }

  const handleStart = () => {
    startAttempt.mutate(undefined, {
      onSuccess: (data) => {
        setAttempt(data);
        setAnswers({});
        setMode("taking");
      },
    });
  };

  const handleSubmit = () => {
    if (!attempt) {
      return;
    }
    const payload = attempt.questions.map((question) => ({
      question_id: question.id,
      selected_option_id: answers[question.id] ?? null,
    }));
    submitAttempt.mutate(
      { attemptId: attempt.id, answers: payload },
      {
        onSuccess: (data) => {
          setAttempt(data);
          setMode("result");
        },
      },
    );
  };

  const handleReview = (attemptId: string) => {
    reviewAttempt.mutate(attemptId, {
      onSuccess: (data) => {
        setAttempt(data);
        setMode("result");
      },
    });
  };

  const backToIntro = () => {
    setAttempt(null);
    setAnswers({});
    setMode("intro");
  };

  const answeredCount = attempt
    ? attempt.questions.filter((q) => answers[q.id]).length
    : 0;

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8">
      <Link
        to={backLink}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al curso
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {evaluation?.title ?? "Evaluación"}
        </h1>
        <p className="text-sm text-gray-500">
          Calificación mínima para aprobar: {PASSING_SCORE}/10 · Máximo{" "}
          {MAX_ATTEMPTS} intentos
        </p>
      </header>

      {mode === "intro" && (
        <div className="space-y-4">
          {previousAttempts.length > 0 && (
            <Card className="space-y-3 p-5">
              <h2 className="text-sm font-semibold text-gray-800">
                Intentos previos
              </h2>
              <ul className="space-y-2">
                {previousAttempts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-gray-600">
                      Intento {a.attempt_number}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {a.score ?? "—"}/10
                      </span>
                      {a.passed ? (
                        <Badge tone="success">Aprobado</Badge>
                      ) : (
                        <Badge tone="neutral">No aprobado</Badge>
                      )}
                      {a.status === "SUBMITTED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReview(a.id)}
                          isLoading={
                            reviewAttempt.isPending &&
                            reviewAttempt.variables === a.id
                          }
                        >
                          Ver revisión
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {reviewAttempt.isError && (
                <Alert tone="error">
                  {getApiErrorMessage(reviewAttempt.error)}
                </Alert>
              )}
            </Card>
          )}

          {hasPassed && (
            <Alert tone="success">
              Ya aprobaste esta evaluación. ¡Felicitaciones!
            </Alert>
          )}
          {!hasPassed && remaining === 0 && (
            <Alert tone="warning">
              Has agotado tus {MAX_ATTEMPTS} intentos para esta evaluación.
            </Alert>
          )}
          {!evaluation?.is_ready && (
            <Alert tone="warning">
              La evaluación aún no está disponible.
            </Alert>
          )}
          {startAttempt.isError && (
            <Alert tone="error">{getApiErrorMessage(startAttempt.error)}</Alert>
          )}

          <Button
            onClick={handleStart}
            isLoading={startAttempt.isPending}
            disabled={!canStart || !evaluation?.is_ready}
          >
            Comenzar evaluación
          </Button>
        </div>
      )}

      {mode === "taking" && attempt && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Respondidas {answeredCount} de {attempt.questions.length}
          </p>
          {attempt.questions.map((question, index) => (
            <AttemptQuestionCard
              key={question.id}
              index={index}
              question={question}
              selectedOptionId={answers[question.id] ?? null}
              onSelect={(optionId) =>
                setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
              }
            />
          ))}
          {submitAttempt.isError && (
            <Alert tone="error">{getApiErrorMessage(submitAttempt.error)}</Alert>
          )}
          <Button
            onClick={handleSubmit}
            isLoading={submitAttempt.isPending}
            className="w-full"
          >
            Enviar respuestas
          </Button>
        </div>
      )}

      {mode === "result" && attempt && (
        <div className="space-y-4">
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            {attempt.passed ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden="true" />
            ) : (
              <XCircle className="h-12 w-12 text-brand-600" aria-hidden="true" />
            )}
            <p className="text-3xl font-bold text-gray-900">
              {attempt.score}/10
            </p>
            <p className="text-sm text-gray-600">
              {attempt.correct_count} de {attempt.total_questions} respuestas
              correctas
            </p>
            <Badge tone={attempt.passed ? "success" : "neutral"}>
              {attempt.passed ? "Aprobado" : "No aprobado"}
            </Badge>
          </Card>

          <h2 className="text-sm font-semibold text-gray-800">
            Revisión de respuestas
          </h2>
          {attempt.questions.map((question, index) => (
            <AttemptQuestionCard
              key={question.id}
              index={index}
              question={question}
              selectedOptionId={
                attempt.answers.find((a) => a.question_id === question.id)
                  ?.selected_option_id ?? null
              }
              result={attempt.answers.find(
                (a) => a.question_id === question.id,
              )}
            />
          ))}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="w-full"
              onClick={backToIntro}
            >
              Volver a la evaluación
            </Button>
            <Link to={backLink} className="w-full">
              <Button variant="ghost" className="w-full">
                Volver al curso
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
