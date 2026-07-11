import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type {
  AdminMetrics,
  InstructorMetrics,
  StudentMetrics,
} from "../types";

export const metricsService = {
  async getAdmin(): Promise<AdminMetrics> {
    const { data } = await axiosClient.get<AdminMetrics>(endpoints.metrics.admin);
    return data;
  },

  async getInstructor(): Promise<InstructorMetrics> {
    const { data } = await axiosClient.get<InstructorMetrics>(
      endpoints.metrics.instructor,
    );
    return data;
  },

  async getStudent(): Promise<StudentMetrics> {
    const { data } = await axiosClient.get<StudentMetrics>(
      endpoints.metrics.student,
    );
    return data;
  },
};
