// Descarga un blob forzando el guardado con el nombre indicado, evitando que el
// navegador lo abra inline (los endpoints requieren el header Authorization).
export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
