// Cliente tal como lo devuelve la API (clientes list / by id, SP_V2_CONSULTA_CLIENTES).
// El tipo de cliente y el régimen fiscal vienen APLANADOS como columnas del cliente.
// Persona moral: razonSocial poblada, nombres/apellidos '' y nombreCompleto = razón social.
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON español.

export interface Cliente {
  idCliente: number;
  /** true = persona moral (razón social); false = persona física. */
  esPersonaMoral: boolean;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  razonSocial: string;
  sociedadMercantil: string;
  /** Nombre completo en mayúsculas (calculado por el SP; para moral = razón social). */
  nombreCompleto: string;
  rfc: string;
  telefono: string;
  correo: string;
  // ------- Domicilio -------
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  localidad: string;
  municipio: string;
  estado: string;
  cp: string;
  // ------- Contacto -------
  nombreContacto: string;
  // ------- Pedidos especiales -------
  latitud: string;
  longitud: string;
  nombreContactoPE: string;
  telefonoContactoPE: string;
  correoContactoPE: string;
  /** Usar los datos generales del cliente como contacto de pedidos especiales. */
  usarDatosCliente: boolean;
  // ------- Crédito -------
  diasCredito: number;
  montoMaximoCredito: number;
  // ------- Fiscales -------
  idRegimenFiscal: number;
  regimenFiscal: string;
  // ------- Tipo de cliente (aplanado) -------
  idTipoCliente: number;
  tipoClienteDescripcion: string;
  /** % de descuento del tipo de cliente. */
  descuento: number;
  activo: boolean;
  fechaAlta: string | null;
}

export class ClienteModel implements Cliente {
  idCliente: number;
  esPersonaMoral: boolean;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  razonSocial: string;
  sociedadMercantil: string;
  nombreCompleto: string;
  rfc: string;
  telefono: string;
  correo: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  localidad: string;
  municipio: string;
  estado: string;
  cp: string;
  nombreContacto: string;
  latitud: string;
  longitud: string;
  nombreContactoPE: string;
  telefonoContactoPE: string;
  correoContactoPE: string;
  usarDatosCliente: boolean;
  diasCredito: number;
  montoMaximoCredito: number;
  idRegimenFiscal: number;
  regimenFiscal: string;
  idTipoCliente: number;
  tipoClienteDescripcion: string;
  descuento: number;
  activo: boolean;
  fechaAlta: string | null;

  constructor(data: Partial<Cliente> = {}) {
    this.idCliente = data.idCliente ?? 0;
    this.esPersonaMoral = data.esPersonaMoral ?? false;
    this.nombres = data.nombres ?? '';
    this.apellidoPaterno = data.apellidoPaterno ?? '';
    this.apellidoMaterno = data.apellidoMaterno ?? '';
    this.razonSocial = data.razonSocial ?? '';
    this.sociedadMercantil = data.sociedadMercantil ?? '';
    this.nombreCompleto = data.nombreCompleto ?? '';
    this.rfc = data.rfc ?? '';
    this.telefono = data.telefono ?? '';
    this.correo = data.correo ?? '';
    this.calle = data.calle ?? '';
    this.numeroExterior = data.numeroExterior ?? '';
    this.numeroInterior = data.numeroInterior ?? '';
    this.colonia = data.colonia ?? '';
    this.localidad = data.localidad ?? '';
    this.municipio = data.municipio ?? '';
    this.estado = data.estado ?? '';
    this.cp = data.cp ?? '';
    this.nombreContacto = data.nombreContacto ?? '';
    this.latitud = data.latitud ?? '';
    this.longitud = data.longitud ?? '';
    this.nombreContactoPE = data.nombreContactoPE ?? '';
    this.telefonoContactoPE = data.telefonoContactoPE ?? '';
    this.correoContactoPE = data.correoContactoPE ?? '';
    this.usarDatosCliente = data.usarDatosCliente ?? false;
    this.diasCredito = data.diasCredito ?? 0;
    this.montoMaximoCredito = data.montoMaximoCredito ?? 0;
    this.idRegimenFiscal = data.idRegimenFiscal ?? 0;
    this.regimenFiscal = data.regimenFiscal ?? '';
    this.idTipoCliente = data.idTipoCliente ?? 0;
    this.tipoClienteDescripcion = data.tipoClienteDescripcion ?? '';
    this.descuento = data.descuento ?? 0;
    this.activo = data.activo ?? true;
    this.fechaAlta = data.fechaAlta ?? null;
  }
}
