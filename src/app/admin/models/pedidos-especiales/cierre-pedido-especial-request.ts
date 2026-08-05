// Payload para realizar el cierre de estación de Pedidos Especiales
// (`POST /api/pedidos-especiales/caja/cerrar`, contrato tentativo documentado en
// `task_cierre_caja_pe.md`). Réplica de `RealizaCierreEstacion` (legado) + mismo mecanismo de
// autorización condicional ya migrado en Ventas (HU: "reutiliza el patrón de
// `CajaService.CerrarAsync`/`CierreRequest`" — ver `admin/models/ventas/cierre-request.ts`). Un
// archivo = una interfaz + su modelo (regla 11).

export interface CierrePedidoEspecialRequest {
  efectivoEntregadoEnCierre: number;
  usuarioAutoriza: string | null;
  contrasena: string | null;
}

export class CierrePedidoEspecialRequestModel implements CierrePedidoEspecialRequest {
  efectivoEntregadoEnCierre: number;
  usuarioAutoriza: string | null;
  contrasena: string | null;

  constructor(data: Partial<CierrePedidoEspecialRequest> = {}) {
    this.efectivoEntregadoEnCierre = data.efectivoEntregadoEnCierre ?? 0;
    this.usuarioAutoriza = data.usuarioAutoriza ?? null;
    this.contrasena = data.contrasena ?? null;
  }
}
