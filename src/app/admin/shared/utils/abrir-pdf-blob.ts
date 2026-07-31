// Abre en una pestaña nueva un PDF recibido como Blob desde el backend (QuestPDF, sin
// temporales en disco). Mismo patrón que `CodigosBarrasComponent.abrirPdf` (Productos):
// `URL.createObjectURL` + `window.open` + `revokeObjectURL` diferido. Centralizado aquí
// (regla 00) para no duplicarlo en cada pantalla que abra un ticket/PDF generado por la API.

export function abrirPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Abre el PDF igual que `abrirPdfBlob` y además dispara el diálogo de impresión del navegador
 * en cuanto la pestaña termina de cargar. Es la aproximación web más cercana a "Imprimir
 * Ticket" del legado — que en realidad mandaba el ticket directo a una impresora térmica del
 * servidor, capacidad fuera de alcance de esta migración (pendiente de un servicio ESC/POS
 * dedicado, ver notas de la HU de `ventas`). Aquí el usuario elige la impresora desde el
 * diálogo nativo del navegador.
 */
export function imprimirPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, '_blank');
  ventana?.addEventListener('load', () => ventana.print());
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
