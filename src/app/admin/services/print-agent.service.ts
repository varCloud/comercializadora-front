import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Cliente del agente local de impresión POS (repo `comercializadora-print-agent`, API .NET
 * mínima que corre en `127.0.0.1` de cada estación). Recibe el PDF ya generado por la API
 * central (QuestPDF) y lo manda a imprimir a la impresora térmica física de esa estación —
 * ver `.claude/docs/...` / plan de "Agente local de impresión POS".
 *
 * Timeout corto (2s) porque el llamador necesita una respuesta rápida para decidir el
 * fallback (abrir el diálogo de impresión del navegador, ver `abrir-pdf-blob.ts`): una
 * estación sin el agente instalado (rollout gradual) o apagado no debe dejar la pantalla
 * esperando. Cualquier error (timeout, conexión rechazada, respuesta no exitosa) se normaliza
 * a `false` — nunca propaga el error al suscriptor.
 */
@Injectable({ providedIn: 'root' })
export class PrintAgentService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = environment.PRINT_AGENT_URL;

  /** Manda el PDF (bytes crudos, sin FormData) a imprimir en la impresora de la estación. */
  imprimirDocumento(pdf: Blob): Observable<boolean> {
    return this.http
      .post(`${this.baseUri}/document`, pdf, {
        headers: { 'Content-Type': 'application/pdf' },
        observe: 'response',
      })
      .pipe(
        timeout(2000),
        map((res) => res.ok),
        catchError((err) => {
          console.error('Error al imprimir el documento con el agente local de impresión', err);
          return of(false);
        }),
      );
  }

  /** Dispara el pulso de apertura del cajón de dinero (sin body). */
  abrirCajon(): Observable<boolean> {
    return this.http
      .post(`${this.baseUri}/cash-drawer`, null, { observe: 'response' })
      .pipe(
        timeout(2000),
        map((res) => res.ok),
        catchError((err) => {
          console.error('Error al abrir el cajón con el agente local de impresión', err);
          return of(false);
        }),
      );
  }
}
