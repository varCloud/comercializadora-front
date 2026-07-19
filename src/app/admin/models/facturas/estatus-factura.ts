// Estatus de factura (tabla FacCatEstatusFactura / enum EstatusFactura del back). Es un catálogo
// fijo (no hay endpoint dedicado): se modela como constante en vez de traerlo del servidor.
// Un archivo = una interfaz + su modelo (regla 11); aquí además se fija el catálogo de valores.

import { Catalogo } from 'src/app/admin/models/shared/catalogo';

export enum EstatusFacturaId {
  Facturada = 1,
  Cancelada = 2,
  Error = 3,
  PendienteDeCancelacion = 4,
}

/** Opciones del filtro "Estatus de la factura" (mat-select, ≤10 → regla 16). Sin la opción
 *  "--TODOS--": el componente la antepone usando la clave de traducción `facturas.filters.todos`. */
export const ESTATUS_FACTURA_OPTIONS: Catalogo[] = [
  { id: EstatusFacturaId.Facturada, descripcion: 'Facturada' },
  { id: EstatusFacturaId.Cancelada, descripcion: 'Cancelada' },
  { id: EstatusFacturaId.Error, descripcion: 'Error' },
  { id: EstatusFacturaId.PendienteDeCancelacion, descripcion: 'Pendiente de cancelación' },
];
