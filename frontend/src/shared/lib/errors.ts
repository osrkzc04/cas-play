import { AxiosError } from "axios";

interface ApiErrorBody {
  detail?: string | { msg?: string }[];
}

const FALLBACK = "Ocurrió un error inesperado. Inténtalo nuevamente.";

// Backend returns user-facing messages in Spanish under `detail`; FastAPI
// validation errors arrive as an array of `{ msg }` objects instead.
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as ApiErrorBody | undefined)?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail[0]?.msg) {
      return detail[0].msg;
    }
    if (error.code === "ERR_NETWORK") {
      return "No se pudo conectar con el servidor.";
    }
  }
  return FALLBACK;
}
