import { useState } from "react";

import {
  Alert,
  Avatar,
  Card,
  EmptyState,
  Spinner,
  StarRating,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate, getInitialsFromName } from "@/shared/lib/format";
import type { Role } from "@/shared/auth/types";
import { useMyRating, useRatingSummary, useRatings } from "../hooks/useRatings";
import { useSubmitRating } from "../hooks/useRatings";
import type { RatingFormValues } from "../schemas/ratingSchemas";
import { RATING_MIN_PROGRESS } from "../types";
import { RatingForm } from "./RatingForm";

interface CourseRatingsSectionProps {
  courseId: string;
  role: Role | undefined;
  canRate: boolean;
  progressPercentage: number;
}

function formatAverage(average: number | null): string {
  return average === null ? "—" : average.toFixed(1);
}

export function CourseRatingsSection({
  courseId,
  role,
  canRate,
  progressPercentage,
}: CourseRatingsSectionProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const summaryQuery = useRatingSummary(courseId);
  const listQuery = useRatings(courseId, 1, 10);
  const myRatingQuery = useMyRating(courseId, canRate ? role : undefined);

  const myRating = myRatingQuery.data ?? null;
  const isUpdate = Boolean(myRating);
  // Solo puede valorar quien completó al menos el 90% del curso (BR-031);
  // quien ya valoró conserva el acceso para editar su reseña.
  const meetsProgress = progressPercentage >= RATING_MIN_PROGRESS;
  const canSubmit = canRate && (isUpdate || meetsProgress);
  const submitRating = useSubmitRating(courseId, isUpdate);

  const handleSubmit = (values: RatingFormValues) => {
    setFeedback(null);
    submitRating.mutate(
      { score: values.score, comment: values.comment || null },
      {
        onSuccess: () =>
          setFeedback(
            isUpdate ? "Tu valoración fue actualizada." : "¡Gracias por tu valoración!",
          ),
      },
    );
  };

  const average = summaryQuery.data?.average ?? null;
  const total = summaryQuery.data?.total ?? 0;
  const reviews = listQuery.data?.items ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Valoraciones del curso
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatAverage(average)}
          </span>
          <div className="flex flex-col">
            <StarRating value={average ?? 0} size="sm" />
            <span className="text-xs text-gray-500">
              {total} {total === 1 ? "valoración" : "valoraciones"}
            </span>
          </div>
        </div>
      </div>

      {canRate && !canSubmit && (
        <Alert tone="info">
          Podrás valorar este curso cuando completes al menos el{" "}
          {RATING_MIN_PROGRESS}% del contenido.
        </Alert>
      )}

      {canSubmit && (
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-gray-800">
            {isUpdate ? "Edita tu valoración" : "Valora este curso"}
          </h3>
          {feedback && <Alert tone="success">{feedback}</Alert>}
          {submitRating.isError && (
            <Alert tone="error">{getApiErrorMessage(submitRating.error)}</Alert>
          )}
          {myRatingQuery.isLoading ? (
            <Spinner />
          ) : (
            <RatingForm
              key={myRating?.id ?? "new"}
              defaultValues={{
                score: myRating?.score,
                comment: myRating?.comment,
              }}
              isSubmitting={submitRating.isPending}
              submitLabel={isUpdate ? "Actualizar valoración" : "Enviar valoración"}
              onSubmit={handleSubmit}
            />
          )}
        </Card>
      )}

      {listQuery.isLoading ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="Aún no hay reseñas"
          description="Sé el primero en compartir tu opinión sobre este curso."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar initials={getInitialsFromName(review.student_name)} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {review.student_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                      <StarRating value={review.score} size="sm" />
                    </div>
                    {review.comment ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-400">Sin comentario</p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
