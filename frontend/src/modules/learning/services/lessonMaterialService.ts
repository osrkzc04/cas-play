import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import { saveBlob } from "@/shared/lib/download";
import type { Material } from "@/modules/courseContent/types";

export const lessonMaterialService = {
  async list(lessonId: string): Promise<Material[]> {
    const { data } = await axiosClient.get<Material[]>(
      endpoints.materials.list(lessonId),
    );
    return data;
  },

  async download(material: Material): Promise<void> {
    const { data } = await axiosClient.get<Blob>(
      endpoints.materials.download(material.id),
      { responseType: "blob" },
    );
    saveBlob(data, material.original_name);
  },
};
