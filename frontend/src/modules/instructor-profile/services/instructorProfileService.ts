import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type {
  InstructorProfile,
  UpdateInstructorProfilePayload,
} from "../types";

export const instructorProfileService = {
  async getOwn(): Promise<InstructorProfile> {
    const { data } = await axiosClient.get<InstructorProfile>(
      endpoints.instructorProfile.own,
    );
    return data;
  },

  async update(
    payload: UpdateInstructorProfilePayload,
  ): Promise<InstructorProfile> {
    const { data } = await axiosClient.put<InstructorProfile>(
      endpoints.instructorProfile.own,
      payload,
    );
    return data;
  },

  async uploadPhoto(file: File): Promise<InstructorProfile> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axiosClient.put<InstructorProfile>(
      endpoints.instructorProfile.photo,
      form,
      // Deja que el navegador fije el boundary multipart.
      { headers: { "Content-Type": undefined } },
    );
    return data;
  },

  async removePhoto(): Promise<InstructorProfile> {
    const { data } = await axiosClient.delete<InstructorProfile>(
      endpoints.instructorProfile.photo,
    );
    return data;
  },
};
