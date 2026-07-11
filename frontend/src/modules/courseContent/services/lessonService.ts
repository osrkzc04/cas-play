import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Lesson, LessonPayload } from "../types";

// El axiosClient fuerza Content-Type JSON; al enviar FormData hay que quitarlo
// para que el navegador fije el boundary multipart correcto.
const multipart = { headers: { "Content-Type": undefined } } as const;

export const lessonService = {
  async list(moduleId: string): Promise<Lesson[]> {
    const { data } = await axiosClient.get<Lesson[]>(
      endpoints.lessons.list(moduleId),
    );
    return data;
  },

  async create(moduleId: string, payload: LessonPayload): Promise<Lesson> {
    const { data } = await axiosClient.post<Lesson>(
      endpoints.lessons.create(moduleId),
      payload,
    );
    return data;
  },

  async update(lessonId: string, payload: LessonPayload): Promise<Lesson> {
    const { data } = await axiosClient.patch<Lesson>(
      endpoints.lessons.update(lessonId),
      payload,
    );
    return data;
  },

  async remove(lessonId: string): Promise<void> {
    await axiosClient.delete(endpoints.lessons.delete(lessonId));
  },

  async reorder(moduleId: string, lessonIds: string[]): Promise<Lesson[]> {
    const { data } = await axiosClient.post<Lesson[]>(
      endpoints.lessons.reorder(moduleId),
      { lesson_ids: lessonIds },
    );
    return data;
  },

  async uploadVideo(lessonId: string, file: File): Promise<Lesson> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axiosClient.put<Lesson>(
      endpoints.lessons.video(lessonId),
      form,
      multipart,
    );
    return data;
  },

  async deleteVideo(lessonId: string): Promise<Lesson> {
    const { data } = await axiosClient.delete<Lesson>(
      endpoints.lessons.video(lessonId),
    );
    return data;
  },
};
