import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { CourseProgress, LessonProgress } from "../types";

export const progressService = {
  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const { data } = await axiosClient.get<CourseProgress>(
      endpoints.progress.course(courseId),
    );
    return data;
  },

  async saveLastSecond(
    lessonId: string,
    lastSecond: number,
  ): Promise<LessonProgress> {
    const { data } = await axiosClient.put<LessonProgress>(
      endpoints.progress.lesson(lessonId),
      { last_second: Math.floor(lastSecond) },
    );
    return data;
  },

  async completeLesson(lessonId: string): Promise<LessonProgress> {
    const { data } = await axiosClient.post<LessonProgress>(
      endpoints.progress.complete(lessonId),
    );
    return data;
  },
};
