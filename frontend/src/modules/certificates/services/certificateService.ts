import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import { saveBlob } from "@/shared/lib/download";
import type { Paginated } from "@/shared/types/pagination";
import type {
  Certificate,
  CertificateEligibility,
  CertificateVerification,
} from "../types";

export const certificateService = {
  async getEligibility(courseId: string): Promise<CertificateEligibility> {
    const { data } = await axiosClient.get<CertificateEligibility>(
      endpoints.certificates.eligibility(courseId),
    );
    return data;
  },

  async issue(courseId: string): Promise<Certificate> {
    const { data } = await axiosClient.post<Certificate>(
      endpoints.certificates.issue(courseId),
    );
    return data;
  },

  async getMine(params: {
    page: number;
    size: number;
  }): Promise<Paginated<Certificate>> {
    const { data } = await axiosClient.get<Paginated<Certificate>>(
      endpoints.certificates.mine,
      { params },
    );
    return data;
  },

  async download(certificate: Certificate): Promise<void> {
    const { data } = await axiosClient.get<Blob>(
      endpoints.certificates.download(certificate.id),
      { responseType: "blob" },
    );
    saveBlob(data, `certificado-${certificate.code}.pdf`);
  },

  // Supervisión global de certificados emitidos (ADMIN).
  async listAll(params: {
    page: number;
    size: number;
    course_id?: string;
  }): Promise<Paginated<Certificate>> {
    const { data } = await axiosClient.get<Paginated<Certificate>>(
      endpoints.adminCertificates.list,
      { params },
    );
    return data;
  },

  async downloadAsAdmin(certificate: Certificate): Promise<void> {
    const { data } = await axiosClient.get<Blob>(
      endpoints.adminCertificates.download(certificate.id),
      { responseType: "blob" },
    );
    saveBlob(data, `certificado-${certificate.code}.pdf`);
  },

  // Validación pública por código (sin autenticación).
  async verify(code: string): Promise<CertificateVerification> {
    const { data } = await axiosClient.get<CertificateVerification>(
      endpoints.certificates.verify(code),
    );
    return data;
  },
};
