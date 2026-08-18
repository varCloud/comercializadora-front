// Abre en una pestaña nueva un PDF recibido como Blob desde el backend (QuestPDF, sin
// temporales en disco). Mismo patrón que `CodigosBarrasComponent.abrirPdf` (Productos):
// `URL.createObjectURL` + `window.open` + `revokeObjectURL` diferido. Centralizado aquí
// (regla 00) para no duplicarlo en cada pantalla que abra un ticket/PDF generado por la API.

import { PrintAgentService } from 'src/app/admin/services/print-agent.service';

export function abrirPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Intenta imprimir el ticket con el agente local de impresión POS (`PrintAgentService`, API
 * .NET en `127.0.0.1` de la estación) que manda el PDF directo a la impresora térmica física,
 * sin pasar por el navegador. Si el agente no responde (estación sin agente instalado todavía
 * — rollout gradual — o apagado, el servicio ya normaliza cualquier fallo/timeout a `false`),
 * cae al comportamiento anterior: abre el PDF en pestaña nueva y dispara el diálogo de
 * impresión del navegador en cuanto termina de cargar, para que el usuario elija la impresora
 * a mano.
 *
 * `printAgent` se recibe ya inyectado desde el componente que llama (no puede auto-inyectarse
 * aquí: `imprimirPdfBlob` es una función suelta, fuera de un contexto de inyección de Angular,
 * y `inject()` solo funciona dentro de uno).
 */
export function imprimirPdfBlob(blob: Blob, printAgent: PrintAgentService): void {
  printAgent.imprimirDocumento(blob).subscribe((impreso) => {
    if (impreso) return;

    const url = URL.createObjectURL(blob);
    const ventana = window.open(url, '_blank');
    ventana?.addEventListener('load', () => ventana.print());
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
}
