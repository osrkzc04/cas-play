import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Curriculum } from "../types";

export const curriculumService = {
  async getByCourse(courseId: string): Promise<Curriculum> {
    const { data } = await axiosClient.get<Curriculum>(
      endpoints.curriculum.byCourse(courseId),
    );
    return data;
  },
};
