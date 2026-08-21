// Producto de un pedido especial a confirmar en la entrega (tabla `#tblConfirmarProductos` de
// `ConfirmarProductos.cshtml`, Bloque B). Contrato real verificado (FE-B5): `GET
// /pedidos-especiales/{folio}/productos-confirmar`, mapea `PedidoEspecialDetalleProducto` de
// comercializadora-api. Combina esos datos con el estado editable en pantalla:
// `cantidadAceptada` (input inicializado con `cantidadAtendida`, igual que el legado
// `value="@item.cantidadAtendida"`) y `observacionesConfirmar` (input libre, obligatorio si no
// se acepta toda la cantidad atendida — ver `validarProductosAceptados()` en
// `EvtConfirmarProductosV2.js`). Un archivo = una interfaz + su modelo (regla 09/11), nombres de
// campo = contrato JSON real de la API.
//
// Ajustes frente al boceto original (API-B3 ya resuelta):
// - **No existe un campo `id` separado** en el contrato real: la API solo expone
//   `idPedidoEspecialDetalle` (bigint) como identificador único de la fila — se usa también
//   como `track`/clave de actualización en el componente, no hay un "id" adicional.
// - **`cantidad` → `cantidadSolicitada`**: verificado contra `EvtConfirmarProductosV2.js`
//   (`tblProductos.rows[i].cells[6]`, columna "Solicitada" del legado) — el valor que se
//   muestra ahí es `cantidadSolicitada` (columna calculada por el SP como
//   `coalesce(cantidadAceptada + cantidadRechazada, 0)`), no la `Cantidad` original de la
//   línea. Renombrado para que el nombre de campo replique el contrato real (regla 09).
export interface ProductoConfirmar {
  /** PK real de la línea (bigint en la API); único identificador — se usa como `id`/track. */
  idPedidoEspecialDetalle: number;
  idPedidoEspecial: number;
  idProducto: number;
  descripcion: string;
  /** Destino de la línea (`item.IdAlmacen`, alias de `IdAlmacenDestino` en la API). */
  idAlmacen: number;
  /** Nombre del almacén destino (`item.Almacen`, columna de texto ya resuelta por el SP). */
  almacen: string;
  precioVenta: number;
  /**
   * Cantidad ORIGINAL de la línea (`item.Cantidad` cruda del SP) — a diferencia de
   * `cantidadSolicitada` (calculada como `cantidadAceptada + cantidadRechazada`, 0 mientras el
   * pedido no se procesa), este campo sí refleja lo pedido en el alta/cotización original. Usado
   * por P-07 ("Editar cotización") para precargar `NuevoPedidoComponent` — réplica de
   * `AgregarProductosPedidoEspecial()` (`EvtPedidosEspecialesV2.js:1580`), que reusa este mismo
   * SP (`ObtenerProductosPedidoEspecial` → `ConsultaPedidoEspecialDetalle`).
   */
  cantidad: number;
  /** Precio unitario normal ("Precio Menudeo" en UI, ver `precios-producto.ts`). Solo poblado por el SP; 0 si no aplica. */
  precioIndividual: number;
  /** Precio aplicado por defecto cuando el pedido completo alcanza 6+ artículos. */
  precioMenudeo: number;
  /** Cantidad solicitada al almacén (columna "Solicitada" del legado). */
  cantidadSolicitada: number;
  /** Observaciones de entrega ya registradas (solo lectura en esta pantalla). */
  observaciones: string | null;
  /** Cantidad que el almacén atendió (referencia, solo lectura). */
  cantidadAtendida: number;
  /** Cantidad que el almacén rechazó (referencia, solo lectura). */
  cantidadRechazada: number;
  /** Editable: cantidad que el cliente/receptor finalmente acepta (default = cantidadAtendida). */
  cantidadAceptada: number;
  /** Editable: motivo si `cantidadAceptada` no cubre toda la `cantidadAtendida`. */
  observacionesConfirmar: string;
  /** Existencia actual en el almacén destino (`cantidadActualInvAlmacen`, left join — null si no hay registro). Usado por P-07 para tope de cantidad al precargar. */
  cantidadActualInvAlmacen: number | null;
  idTicketMayoreo: number;
}

export class ProductoConfirmarModel implements ProductoConfirmar {
  idPedidoEspecialDetalle: number;
  idPedidoEspecial: number;
  idProducto: number;
  descripcion: string;
  idAlmacen: number;
  almacen: string;
  precioVenta: number;
  cantidad: number;
  precioIndividual: number;
  precioMenudeo: number;
  cantidadSolicitada: number;
  observaciones: string | null;
  cantidadAtendida: number;
  cantidadRechazada: number;
  cantidadAceptada: number;
  observacionesConfirmar: string;
  cantidadActualInvAlmacen: number | null;
  idTicketMayoreo: number;

  constructor(data: Partial<ProductoConfirmar> = {}) {
    this.idPedidoEspecialDetalle = data.idPedidoEspecialDetalle ?? 0;
    this.idPedidoEspecial = data.idPedidoEspecial ?? 0;
    this.idProducto = data.idProducto ?? 0;
    this.descripcion = data.descripcion ?? '';
    this.idAlmacen = data.idAlmacen ?? 0;
    this.almacen = data.almacen ?? '';
    this.precioVenta = data.precioVenta ?? 0;
    this.cantidad = data.cantidad ?? 0;
    this.precioIndividual = data.precioIndividual ?? 0;
    this.precioMenudeo = data.precioMenudeo ?? 0;
    this.cantidadSolicitada = data.cantidadSolicitada ?? 0;
    this.observaciones = data.observaciones ?? null;
    this.cantidadAtendida = data.cantidadAtendida ?? 0;
    this.cantidadRechazada = data.cantidadRechazada ?? 0;
    this.cantidadAceptada = data.cantidadAceptada ?? this.cantidadAtendida;
    this.observacionesConfirmar = data.observacionesConfirmar ?? '';
    this.cantidadActualInvAlmacen = data.cantidadActualInvAlmacen ?? null;
    this.idTicketMayoreo = data.idTicketMayoreo ?? 0;
  }
}
