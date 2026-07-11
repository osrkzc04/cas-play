import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { evaluationService } from "../services/evaluationService";
import type { EvaluationPayload, QuestionPayload } from "../types";

export const evaluationKeys = {
  all: ["evaluations"] as const,
  byCourse: (courseId: string) =>
    [...evaluationKeys.all, "course", courseId] as const,
};

export function useCourseEvaluation(courseId: string) {
  return useQuery({
    queryKey: evaluationKeys.byCourse(courseId),
    queryFn: () => evaluationService.getByCourse(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCreateEvaluation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EvaluationPayload) =>
      evaluationService.create(courseId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.byCourse(courseId),
      }),
  });
}

export function useUpdateEvaluation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EvaluationPayload }) =>
      evaluationService.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.byCourse(courseId),
      }),
  });
}

export function useDeleteEvaluation(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => evaluationService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.byCourse(courseId),
      }),
  });
}

export function useAddQuestion(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuestionPayload }) =>
      evaluationService.addQuestion(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.byCourse(courseId),
      }),
  });
}

export function useUpdateQuestion(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuestionPayload }) =>
      evaluationService.updateQuestion(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.byCourse(courseId),
      }),
  });
}

export function useDeleteQuestion(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      evaluationService.deleteQuestion(questionId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.byCourse(courseId),
      }),
  });
}
