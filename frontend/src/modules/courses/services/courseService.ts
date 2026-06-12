import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type {
  Course,
  CourseStatus,
  CourseStatusAction,
  CreateCoursePayload,
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
  async getCatalog(params: CatalogParams): Promise<Paginated<Course>> {
    const { data } = await axiosClient.get<Paginated<Course>>(
      endpoints.courses.catalog,
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<Course> {
    const { data } = await axiosClient.get<Course>(
      endpoints.courses.detail(id),
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
};
