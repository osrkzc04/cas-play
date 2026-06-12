import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { courseService } from "../services/courseService";
import type {
  CourseStatus,
  CourseStatusAction,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "../types";

export const courseKeys = {
  all: ["courses"] as const,
  catalog: (page: number, size: number) =>
    [...courseKeys.all, "catalog", page, size] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
  manage: (page: number, size: number, status?: CourseStatus) =>
    [...courseKeys.all, "manage", page, size, status ?? "ALL"] as const,
};

export function useCoursesCatalog(page: number, size: number) {
  return useQuery({
    queryKey: courseKeys.catalog(page, size),
    queryFn: () => courseService.getCatalog({ page, size }),
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(id ?? ""),
    queryFn: () => courseService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useManagedCourses(
  page: number,
  size: number,
  status?: CourseStatus,
) {
  return useQuery({
    queryKey: courseKeys.manage(page, size, status),
    queryFn: () =>
      courseService.getManaged({ page, size, course_status: status }),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) =>
      courseService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoursePayload) =>
      courseService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useCourseStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: CourseStatusAction;
    }) => courseService.changeStatus(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}
