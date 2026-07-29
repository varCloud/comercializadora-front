// Abre en una pestaña nueva un PDF recibido como Blob desde el backend (QuestPDF, sin
// temporales en disco). Mismo patrón que `CodigosBarrasComponent.abrirPdf` (Productos):
// `URL.createObjectURL` + `window.open` + `revokeObjectURL` diferido. Centralizado aquí
// (regla 00) para no duplicarlo en cada pantalla que abra un ticket/PDF generado por la API.

export function abrirPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
