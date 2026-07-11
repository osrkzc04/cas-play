import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type {
  AdminEnrollmentItem,
  AdminEnrollmentPayload,
  AdminEnrollmentResult,
  EnrolledCourse,
  Enrollment,
  EnrollmentStatus,
  UserLookup,
} from "../types";

interface MineParams {
  page: number;
  size: number;
}

interface AdminListParams {
  page: number;
  size: number;
  course_id?: string;
}

export const enrollmentService = {
  async enroll(courseId: string): Promise<Enrollment> {
    const { data } = await axiosClient.post<Enrollment>(
      endpoints.enrollments.enroll(courseId),
    );
    return data;
  },

  async getStatus(courseId: string): Promise<EnrollmentStatus> {
    const { data } = await axiosClient.get<EnrollmentStatus>(
      endpoints.enrollments.status(courseId),
    );
    return data;
  },

  async getMine(params: MineParams): Promise<Paginated<EnrolledCourse>> {
    const { data } = await axiosClient.get<Paginated<EnrolledCourse>>(
      endpoints.enrollments.mine,
      { params },
    );
    return data;
  },

  async listAdmin(
    params: AdminListParams,
  ): Promise<Paginated<AdminEnrollmentItem>> {
    const { data } = await axiosClient.get<Paginated<AdminEnrollmentItem>>(
      endpoints.adminEnrollments.list,
      { params },
    );
    return data;
  },

  async createAdmin(
    payload: AdminEnrollmentPayload,
  ): Promise<AdminEnrollmentResult> {
    const { data } = await axiosClient.post<AdminEnrollmentResult>(
      endpoints.adminEnrollments.create,
      payload,
    );
    return data;
  },

  async lookupUser(email: string): Promise<UserLookup> {
    const { data } = await axiosClient.get<UserLookup>(
      endpoints.adminEnrollments.userLookup,
      { params: { email } },
    );
    return data;
  },
};
