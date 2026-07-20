// Tipo de ticket del reporte de Devoluciones (mapea @idTipoConsulta del SP legado). Es un
// catálogo fijo (no hay endpoint dedicado): se modela como constante, mismo patrón que
// `models/facturas/estatus-factura.ts`. El SP NO admite "todos" para este filtro (cada mitad
// del UNION está condicionada a un valor fijo); 0/null en la API se resuelve a Devoluciones (1).

import { Catalogo } from 'src/app/admin/models/shared/catalogo';

export enum TipoTicketId {
  Devolucion = 1,
  Complemento = 2,
}

/** Opciones del filtro "Tipo" (mat-select, 2 opciones → regla 16). Sin opción "--TODOS--": el
 *  SP no la admite para este filtro. */
export const TIPO_TICKET_OPTIONS: Catalogo[] = [
  { id: TipoTicketId.Devolucion, descripcion: 'Devolución' },
  { id: TipoTicketId.Complemento, descripcion: 'Complemento' },
];
