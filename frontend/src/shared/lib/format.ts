// Las fechas se muestran en la zona horaria de Ecuador (UTC-5) para que
// coincidan con la fecha impresa en el certificado (generada en el backend con
// la misma zona), independientemente de la zona del navegador del visitante.
const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Guayaquil",
});

// Backend stores timestamps in UTC; Intl renders them in Ecuador's timezone.
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return dateFormatter.format(date);
}

// Iniciales a partir de un nombre completo en cadena (p. ej. reseñas públicas
// o de moderación, donde no se dispone de first/last name por separado).
export function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase() || "?";
}
