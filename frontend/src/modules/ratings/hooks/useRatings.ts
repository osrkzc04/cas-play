import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Role } from "@/shared/auth/types";
import { ratingService } from "../services/ratingService";
import type { RatingPayload } from "../types";

export const ratingKeys = {
  all: ["ratings"] as const,
  summary: (courseId: string) =>
    [...ratingKeys.all, "summary", courseId] as const,
  mine: (courseId: string) => [...ratingKeys.all, "mine", courseId] as const,
  list: (courseId: string, page: number, size: number) =>
    [...ratingKeys.all, "list", courseId, page, size] as const,
  admin: (page: number, size: number, courseId?: string) =>
    [...ratingKeys.all, "admin", page, size, courseId ?? null] as const,
};

// La valoración propia solo es consultable por STUDENT (requiere matrícula).
export function useMyRating(
  courseId: string | undefined,
  role: Role | undefined,
) {
  return useQuery({
    queryKey: ratingKeys.mine(courseId ?? ""),
    queryFn: () => ratingService.getMine(courseId as string),
    enabled: Boolean(courseId) && role === "STUDENT",
  });
}

export function useRatingSummary(courseId: string | undefined) {
  return useQuery({
    queryKey: ratingKeys.summary(courseId ?? ""),
    queryFn: () => ratingService.getSummary(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useRatings(
  courseId: string | undefined,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: ratingKeys.list(courseId ?? "", page, size),
    queryFn: () => ratingService.list(courseId as string, { page, size }),
    enabled: Boolean(courseId),
  });
}

export function useSubmitRating(courseId: string, isUpdate: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RatingPayload) =>
      isUpdate
        ? ratingService.update(courseId, payload)
        : ratingService.create(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
    },
  });
}

export function useAdminRatings(page: number, size: number, courseId?: string) {
  return useQuery({
    queryKey: ratingKeys.admin(page, size, courseId),
    queryFn: () => ratingService.listAll({ page, size, course_id: courseId }),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ratingService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
    },
  });
}
