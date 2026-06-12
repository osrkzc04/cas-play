const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  // Surfacing this early avoids cryptic network errors when the env var is missing.
  console.warn(
    "VITE_API_URL no está definido. Configura el archivo .env del frontend.",
  );
}

export const config = {
  apiUrl: apiUrl ?? "http://localhost:8000/api/v1",
} as const;
