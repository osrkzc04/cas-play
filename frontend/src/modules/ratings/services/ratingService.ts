import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type {
  AdminRating,
  PublicRating,
  Rating,
  RatingPayload,
  RatingSummary,
} from "../types";

interface ListParams {
  page: number;
  size: number;
}

export const ratingService = {
  async getSummary(courseId: string): Promise<RatingSummary> {
    const { data } = await axiosClient.get<RatingSummary>(
      endpoints.ratings.summary(courseId),
    );
    return data;
  },

  async getMine(courseId: string): Promise<Rating | null> {
    const { data } = await axiosClient.get<Rating | null>(
      endpoints.ratings.mine(courseId),
    );
    return data;
  },

  async list(
    courseId: string,
    params: ListParams,
  ): Promise<Paginated<PublicRating>> {
    const { data } = await axiosClient.get<Paginated<PublicRating>>(
      endpoints.ratings.list(courseId),
      { params },
    );
    return data;
  },

  async create(courseId: string, payload: RatingPayload): Promise<Rating> {
    const { data } = await axiosClient.post<Rating>(
      endpoints.ratings.create(courseId),
      payload,
    );
    return data;
  },

  async update(courseId: string, payload: RatingPayload): Promise<Rating> {
    const { data } = await axiosClient.put<Rating>(
      endpoints.ratings.update(courseId),
      payload,
    );
    return data;
  },

  // Moderación de valoraciones (ADMIN).
  async listAll(params: {
    page: number;
    size: number;
    course_id?: string;
  }): Promise<Paginated<AdminRating>> {
    const { data } = await axiosClient.get<Paginated<AdminRating>>(
      endpoints.adminRatings.list,
      { params },
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(endpoints.adminRatings.delete(id));
  },
};
