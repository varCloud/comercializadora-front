// Forma de pago (catálogo, GET /ventas/catalogos/formas-pago). Mapea 1:1 la entidad
// `FormaPago` de comercializadora-api. Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-A5): la API NO expone flags "esEfectivo"/"esTarjeta" (a diferencia del catálogo
// simulado anterior, que los traía precalculados). El legado (EvtVentas.js) los determinaba
// comparando el id contra magic numbers (1=Efectivo, 4=Crédito, 18=Débito) — frágil si la BD
// llega a tener ids distintos. Aquí se derivan por texto de `nombre` (columna corta del SP,
// p. ej. "EFECTIVO"/"TARJETA") con `esFormaPagoEfectivo`/`esFormaPagoTarjeta`, mismo criterio
// que ya usa `esRuta` para el tipo de cliente. Únicas implementaciones (regla 00): antes estaban
// duplicadas en `cobro-dialog`, `entregar-pedido-especial-dialog` y `realizar-abono-dialog`.

export interface FormaPago {
  id: number;
  /** Nombre corto (p. ej. "EFECTIVO", "TARJETA"). */
  nombre: string;
  descripcion: string;
}

export class FormaPagoModel implements FormaPago {
  id: number;
  nombre: string;
  descripcion: string;

  constructor(data: Partial<FormaPago> = {}) {
    this.id = data.id ?? 0;
    this.nombre = data.nombre ?? '';
    this.descripcion = data.descripcion ?? '';
  }
}

export function esFormaPagoEfectivo(forma: FormaPago | undefined): boolean {
  return (forma?.nombre ?? '').trim().toUpperCase() === 'EFECTIVO';
}

export function esFormaPagoTarjeta(forma: FormaPago | undefined): boolean {
  return (forma?.nombre ?? '').toUpperCase().includes('TARJETA');
}
