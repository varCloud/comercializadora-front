// Fila de catálogo de configuración de Pedidos Especiales (Bloque D — `GET
// /pedidos-especiales/configuracion`, mapea `ConfiguracionPedidoEspecial` de
// comercializadora-api). Expuesto por completitud del contrato de Bloque D (servicio); los
// valores conocidos del legado (`EnumTipoConfig`: 1=DiasParaHacerComplementos,
// 2=RequiereAutCierre) pertenecen al flujo de Cierre Cajas (feature `cierre_caja_pe`, fuera de
// alcance) — no se consume todavía en ninguna pantalla de este bloque. Un archivo = una interfaz
// + su modelo (regla 09/11).
export interface ConfiguracionPedidoEspecial {
  idConfig: number;
  descripcion: string | null;
  valor: number;
  activo: boolean;
}

export class ConfiguracionPedidoEspecialModel implements ConfiguracionPedidoEspecial {
  idConfig: number;
  descripcion: string | null;
  valor: number;
  activo: boolean;

  constructor(data: Partial<ConfiguracionPedidoEspecial> = {}) {
    this.idConfig = data.idConfig ?? 0;
    this.descripcion = data.descripcion ?? null;
    this.valor = data.valor ?? 0;
    this.activo = data.activo ?? false;
  }
}
