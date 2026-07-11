import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { attemptService } from "../services/attemptService";
import type { AttemptAnswerInput } from "../types";

export const attemptKeys = {
  all: ["attempts"] as const,
  byEvaluation: (evaluationId: string) =>
    [...attemptKeys.all, "evaluation", evaluationId] as const,
};

export function useMyAttempts(evaluationId: string | undefined) {
  return useQuery({
    queryKey: attemptKeys.byEvaluation(evaluationId ?? ""),
    queryFn: () => attemptService.listMine(evaluationId as string),
    enabled: Boolean(evaluationId),
  });
}

// Carga bajo demanda el detalle de un intento ya enviado para revisar aciertos
// y errores; se resuelve como mutación por dispararse desde un click puntual.
export function useReviewAttempt() {
  return useMutation({
    mutationFn: (attemptId: string) => attemptService.get(attemptId),
  });
}

export function useStartAttempt(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attemptService.start(evaluationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attemptKeys.byEvaluation(evaluationId),
      });
    },
  });
}

export function useSubmitAttempt(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: string;
      answers: AttemptAnswerInput[];
    }) => attemptService.submit(attemptId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attemptKeys.byEvaluation(evaluationId),
      });
    },
  });
}
