import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Role } from "@/shared/auth/types";
import { enrollmentService } from "../services/enrollmentService";
import type { AdminEnrollmentPayload } from "../types";

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  status: (courseId: string) =>
    [...enrollmentKeys.all, "status", courseId] as const,
  mine: (page: number, size: number) =>
    [...enrollmentKeys.all, "mine", page, size] as const,
  admin: (page: number, size: number, courseId?: string) =>
    [...enrollmentKeys.all, "admin", page, size, courseId ?? "ALL"] as const,
};

// El estado de matrícula solo es consultable por STUDENT; el resto de roles
// no debe disparar la petición (devolvería 403).
export function useEnrollmentStatus(
  courseId: string | undefined,
  role: Role | undefined,
) {
  return useQuery({
    queryKey: enrollmentKeys.status(courseId ?? ""),
    queryFn: () => enrollmentService.getStatus(courseId as string),
    enabled: Boolean(courseId) && role === "STUDENT",
  });
}

export function useMyEnrollments(page: number, size: number) {
  return useQuery({
    queryKey: enrollmentKeys.mine(page, size),
    queryFn: () => enrollmentService.getMine({ page, size }),
  });
}

export function useEnroll(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enrollmentService.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}

export function useAdminEnrollments(
  page: number,
  size: number,
  courseId?: string,
) {
  return useQuery({
    queryKey: enrollmentKeys.admin(page, size, courseId),
    queryFn: () =>
      enrollmentService.listAdmin({ page, size, course_id: courseId }),
  });
}

export function useCreateAdminEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminEnrollmentPayload) =>
      enrollmentService.createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}
