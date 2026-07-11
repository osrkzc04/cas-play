import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Module, ModulePayload } from "../types";

export const moduleService = {
  async list(courseId: string): Promise<Module[]> {
    const { data } = await axiosClient.get<Module[]>(
      endpoints.modules.list(courseId),
    );
    return data;
  },

  async create(courseId: string, payload: ModulePayload): Promise<Module> {
    const { data } = await axiosClient.post<Module>(
      endpoints.modules.create(courseId),
      payload,
    );
    return data;
  },

  async update(moduleId: string, payload: ModulePayload): Promise<Module> {
    const { data } = await axiosClient.patch<Module>(
      endpoints.modules.update(moduleId),
      payload,
    );
    return data;
  },

  async remove(moduleId: string): Promise<void> {
    await axiosClient.delete(endpoints.modules.delete(moduleId));
  },

  async reorder(courseId: string, moduleIds: string[]): Promise<Module[]> {
    const { data } = await axiosClient.post<Module[]>(
      endpoints.modules.reorder(courseId),
      { module_ids: moduleIds },
    );
    return data;
  },
};
