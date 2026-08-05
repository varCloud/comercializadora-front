// Payload para validar usuario/contraseña de un autorizador antes del cierre de caja de
// Pedidos Especiales (`POST /api/pedidos-especiales/caja/validar-usuario`, `SP_VALIDA_USUARIO`
// caso `AutorizarCierre`). Migra el modal `ModalAutorizarCierre` del legado
// (`evtCierreCajasPedidosEspeciales.js`), expuesto aquí como endpoint propio del módulo (sin
// llamar cruzado a `CajaRepository`/Ventas). Un archivo = una interfaz + su modelo (regla 11).

export interface ValidarUsuarioPedidoEspecialRequest {
  usuario: string;
  contrasena: string;
}

export class ValidarUsuarioPedidoEspecialRequestModel implements ValidarUsuarioPedidoEspecialRequest {
  usuario: string;
  contrasena: string;

  constructor(data: Partial<ValidarUsuarioPedidoEspecialRequest> = {}) {
    this.usuario = data.usuario ?? '';
    this.contrasena = data.contrasena ?? '';
  }
}
