import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type {
  Course,
  CourseCatalogItem,
  CourseDetail,
  CourseStatus,
  CourseStatusAction,
  CourseStudent,
  CourseTopic,
  CreateCoursePayload,
  ReplaceTopicsPayload,
  UpdateCoursePayload,
} from "../types";

interface CatalogParams {
  page: number;
  size: number;
}

interface ManageParams extends CatalogParams {
  course_status?: CourseStatus;
}

const statusActionEndpoint: Record<CourseStatusAction, (id: string) => string> =
  {
    publish: endpoints.courses.publish,
    hide: endpoints.courses.hide,
    finish: endpoints.courses.finish,
  };

export const courseService = {
  async getCatalog(
    params: CatalogParams,
  ): Promise<Paginated<CourseCatalogItem>> {
    const { data } = await axiosClient.get<Paginated<CourseCatalogItem>>(
      endpoints.courses.catalog,
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<CourseDetail> {
    const { data } = await axiosClient.get<CourseDetail>(
      endpoints.courses.detail(id),
    );
    return data;
  },

  async getManagedById(id: string): Promise<CourseDetail> {
    const { data } = await axiosClient.get<CourseDetail>(
      endpoints.courses.manageDetail(id),
    );
    return data;
  },

  async getManaged(params: ManageParams): Promise<Paginated<Course>> {
    const { data } = await axiosClient.get<Paginated<Course>>(
      endpoints.courses.manage,
      { params },
    );
    return data;
  },

  async create(payload: CreateCoursePayload): Promise<Course> {
    const { data } = await axiosClient.post<Course>(
      endpoints.courses.create,
      payload,
    );
    return data;
  },

  async update(id: string, payload: UpdateCoursePayload): Promise<Course> {
    const { data } = await axiosClient.patch<Course>(
      endpoints.courses.update(id),
      payload,
    );
    return data;
  },

  async changeStatus(
    id: string,
    action: CourseStatusAction,
  ): Promise<Course> {
    const { data } = await axiosClient.post<Course>(
      statusActionEndpoint[action](id),
    );
    return data;
  },

  async replaceTopics(
    id: string,
    payload: ReplaceTopicsPayload,
  ): Promise<CourseTopic[]> {
    const { data } = await axiosClient.put<CourseTopic[]>(
      endpoints.courses.topics(id),
      payload,
    );
    return data;
  },

  async uploadCover(id: string, file: File): Promise<Course> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axiosClient.put<Course>(
      endpoints.courses.cover(id),
      form,
      // Deja que el navegador fije el boundary multipart.
      { headers: { "Content-Type": undefined } },
    );
    return data;
  },

  async deleteCover(id: string): Promise<Course> {
    const { data } = await axiosClient.delete<Course>(
      endpoints.courses.cover(id),
    );
    return data;
  },

  async getStudents(
    id: string,
    params: CatalogParams,
  ): Promise<Paginated<CourseStudent>> {
    const { data } = await axiosClient.get<Paginated<CourseStudent>>(
      endpoints.courses.students(id),
      { params },
    );
    return data;
  },
};
