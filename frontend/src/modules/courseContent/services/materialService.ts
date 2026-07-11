import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Material } from "../types";

const multipart = { headers: { "Content-Type": undefined } } as const;

export const materialService = {
  async list(lessonId: string): Promise<Material[]> {
    const { data } = await axiosClient.get<Material[]>(
      endpoints.materials.list(lessonId),
    );
    return data;
  },

  async upload(lessonId: string, file: File): Promise<Material> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await axiosClient.post<Material>(
      endpoints.materials.create(lessonId),
      form,
      multipart,
    );
    return data;
  },

  async remove(materialId: string): Promise<void> {
    await axiosClient.delete(endpoints.materials.delete(materialId));
  },

  // Descarga el archivo como blob (con auth) y devuelve un object URL para
  // previsualizarlo. Quien lo use debe revocarlo con URL.revokeObjectURL.
  async getObjectUrl(materialId: string): Promise<string> {
    const { data } = await axiosClient.get<Blob>(
      endpoints.materials.download(materialId),
      { responseType: "blob" },
    );
    return URL.createObjectURL(data);
  },

  async openInNewTab(materialId: string): Promise<void> {
    const url = await this.getObjectUrl(materialId);
    window.open(url, "_blank", "noopener");
    // Se revoca tras un margen para que la pestaña alcance a cargarlo.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
