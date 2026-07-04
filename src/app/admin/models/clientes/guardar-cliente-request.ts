// Payload de alta/edición de cliente (POST/PUT api/clientes). DTO único física/moral:
// el back resuelve el mapeo (moral → razón social en @nombres, apellidos vacíos) y el
// Title Case. Sin campos calculados (nombreCompleto, descripciones) ni fechaAlta.
// Un archivo = una interfaz + su modelo (regla 11).

export interface GuardarClienteRequest {
  /** 0 = alta; > 0 = edición (en PUT lo fija la ruta). */
  idCliente: number;
  /** true = persona moral; activa la validación condicional del back. */
  esPersonaMoral: boolean;
  /** Requerido para persona física. */
  nombres: string | null;
  /** Requerido para persona física. */
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  /** Requerida para persona moral. */
  razonSocial: string | null;
  sociedadMercantil: string | null;
  /** Requerido para persona moral. */
  rfc: string | null;
  /** Opcional; si se captura, exactamente 10 dígitos. */
  telefono: string | null;
  correo: string | null;
  // ------- Domicilio -------
  calle: string | null;
  numeroExterior: string | null;
  numeroInterior: string | null;
  colonia: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  /** Código postal (obligatorio para facturar). */
  cp: string | null;
  // ------- Contacto -------
  nombreContacto: string | null;
  // ------- Pedidos especiales -------
  latitud: string | null;
  longitud: string | null;
  nombreContactoPE: string | null;
  /** Opcional; si se captura, exactamente 10 dígitos. */
  telefonoContactoPE: string | null;
  correoContactoPE: string | null;
  usarDatosCliente: boolean;
  // ------- Crédito -------
  diasCredito: number;
  montoMaximoCredito: number;
  // ------- Clasificación / fiscales -------
  /** Requerido (1–90). */
  idTipoCliente: number;
  /** Requerido (≥ 1, obligatorio para facturar). */
  idRegimenFiscal: number;
}

export class GuardarClienteRequestModel implements GuardarClienteRequest {
  idCliente: number;
  esPersonaMoral: boolean;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  razonSocial: string | null;
  sociedadMercantil: string | null;
  rfc: string | null;
  telefono: string | null;
  correo: string | null;
  calle: string | null;
  numeroExterior: string | null;
  numeroInterior: string | null;
  colonia: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  cp: string | null;
  nombreContacto: string | null;
  latitud: string | null;
  longitud: string | null;
  nombreContactoPE: string | null;
  telefonoContactoPE: string | null;
  correoContactoPE: string | null;
  usarDatosCliente: boolean;
  diasCredito: number;
  montoMaximoCredito: number;
  idTipoCliente: number;
  idRegimenFiscal: number;

  constructor(data: Partial<GuardarClienteRequest> = {}) {
    this.idCliente = data.idCliente ?? 0;
    this.esPersonaMoral = data.esPersonaMoral ?? false;
    this.nombres = data.nombres ?? null;
    this.apellidoPaterno = data.apellidoPaterno ?? null;
    this.apellidoMaterno = data.apellidoMaterno ?? null;
    this.razonSocial = data.razonSocial ?? null;
    this.sociedadMercantil = data.sociedadMercantil ?? null;
    this.rfc = data.rfc ?? null;
    this.telefono = data.telefono ?? null;
    this.correo = data.correo ?? null;
    this.calle = data.calle ?? null;
    this.numeroExterior = data.numeroExterior ?? null;
    this.numeroInterior = data.numeroInterior ?? null;
    this.colonia = data.colonia ?? null;
    this.localidad = data.localidad ?? null;
    this.municipio = data.municipio ?? null;
    this.estado = data.estado ?? null;
    this.cp = data.cp ?? null;
    this.nombreContacto = data.nombreContacto ?? null;
    this.latitud = data.latitud ?? null;
    this.longitud = data.longitud ?? null;
    this.nombreContactoPE = data.nombreContactoPE ?? null;
    this.telefonoContactoPE = data.telefonoContactoPE ?? null;
    this.correoContactoPE = data.correoContactoPE ?? null;
    this.usarDatosCliente = data.usarDatosCliente ?? false;
    this.diasCredito = data.diasCredito ?? 0;
    this.montoMaximoCredito = data.montoMaximoCredito ?? 0;
    this.idTipoCliente = data.idTipoCliente ?? 0;
    this.idRegimenFiscal = data.idRegimenFiscal ?? 0;
  }
}
