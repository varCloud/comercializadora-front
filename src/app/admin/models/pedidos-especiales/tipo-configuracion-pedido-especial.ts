// Claves de configuración parametrizable de Pedidos Especiales
// (`SP_OBTENER_CONFIGURACION_PEDIDOS_ESPECIALES`, tabla propia — NO la de Ventas). Migra
// `EnumTipoConfig` del legado, reusado también por Pedidos Especiales con los mismos valores
// (verificado en `evtCierreCajasPedidosEspeciales.js::RequiereAutorizacion()`, que llama
// `ObtenerConfiguracionPedidosEspeciales(tipoConfig: 2)`). Mismo enum que
// `TipoConfiguracionPedidoEspecial` de comercializadora-api. Se serializa como número.

export enum TipoConfiguracionPedidoEspecialId {
  DiasParaHacerComplementos = 1,
  /** Si está activa (`activo=true` y `valor=1`), el cierre de caja de Pedidos Especiales requiere autorización de un usuario adicional. */
  RequiereAutCierre = 2,
}
