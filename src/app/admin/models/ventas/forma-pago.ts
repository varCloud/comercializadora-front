// Forma de pago (catálogo, GET /ventas/catalogos/formas-pago). Mapea 1:1 la entidad
// `FormaPago` de comercializadora-api. Un archivo = una interfaz + su modelo (regla 11).
//
// NOTA (FE-A5, corregida en auditoría paridad cuentas-por-cobrar-pe P-01): la API NO expone
// flags "esEfectivo"/"esTarjeta". El legado (EvtVentas.js) los determinaba comparando el id
// contra magic numbers (1=Efectivo, 4=Crédito, 18=Débito). Aquí se probó primero derivar por
// texto de `nombre`, pero en runtime real `SP_CONSULTA_FORMA_PAGO` devuelve en `nombre` el
// **código SAT** ("01", "04", "28"...), no un texto — el comparador nunca coincidía y la
// comisión bancaria, el campo Efectivo y la fila Cambio nunca se activaban (bug confirmado con
// una escritura real: `montoRecibido` se enviaba siempre en 0). El campo que sí trae texto real
// es `descripcion` ("Efectivo", "Tarjeta de crédito", "Tarjeta de débito") — se compara contra
// ese en su lugar. Únicas implementaciones (regla 00): `esFormaPagoEfectivo`/`esFormaPagoTarjeta`
// se comparten entre `cobro-dialog`, `entregar-pedido-especial-dialog` y `realizar-abono-dialog`.

export interface FormaPago {
  id: number;
  /** Código SAT corto (p. ej. "01", "04"). NO usar para detectar Efectivo/Tarjeta. */
  nombre: string;
  /** Texto real (p. ej. "Efectivo", "Tarjeta de crédito"). Fuente de verdad para el tipo. */
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
  return (forma?.descripcion ?? '').trim().toUpperCase() === 'EFECTIVO';
}

export function esFormaPagoTarjeta(forma: FormaPago | undefined): boolean {
  return (forma?.descripcion ?? '').toUpperCase().includes('TARJETA');
}
