import { useQuery } from "@tanstack/react-query";

import { metricsService } from "../services/metricsService";

export const metricsKeys = {
  all: ["metrics"] as const,
  admin: () => [...metricsKeys.all, "admin"] as const,
  instructor: () => [...metricsKeys.all, "instructor"] as const,
  student: () => [...metricsKeys.all, "student"] as const,
};

export function useAdminMetrics() {
  return useQuery({
    queryKey: metricsKeys.admin(),
    queryFn: () => metricsService.getAdmin(),
  });
}

export function useInstructorMetrics() {
  return useQuery({
    queryKey: metricsKeys.instructor(),
    queryFn: () => metricsService.getInstructor(),
  });
}

export function useStudentMetrics() {
  return useQuery({
    queryKey: metricsKeys.student(),
    queryFn: () => metricsService.getStudent(),
  });
}
