// Renglón del listado de inventarios físicos, tal como lo devuelve la API
// (GET /api/inventario-fisico, resultset de SP_V2_CONSULTA_INVENTARIO_FISICO).
// Un archivo = una interfaz + su modelo (regla 11). Nombres de campo = contrato JSON de la API.

import { Catalogo } from 'src/app/admin/models/shared/catalogo';
import {
  EstatusInventarioFisico,
  EstatusInventarioFisicoModel,
} from './estatus-inventario-fisico';
import {
  SucursalInventarioFisico,
  SucursalInventarioFisicoModel,
} from './sucursal-inventario-fisico';

/**
 * Tipo de inventario: constante local del front (no hay endpoint de catálogo), paridad con el
 * enum EnumTipoInventarioFisico del legado. Solo 2 opciones, sin "TODOS" (réplica fiel).
 */
export const TIPOS_INVENTARIO_FISICO: Catalogo[] = [
  { id: 1, descripcion: 'General' },
  { id: 2, descripcion: 'Individual' },
];

/** Id del tipo por defecto del filtro (General, paridad con la carga inicial del legado). */
export const TIPO_INVENTARIO_GENERAL = 1;

export interface InventarioFisico {
  idInventarioFisico: number;
  nombre: string | null;
  observaciones: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaAlta: string | null;
  idTipoInventario: number;
  tipoInventario: string | null;
  sucursal: SucursalInventarioFisico;
  estatus: EstatusInventarioFisico;
}

export class InventarioFisicoModel implements InventarioFisico {
  idInventarioFisico: number;
  nombre: string | null;
  observaciones: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaAlta: string | null;
  idTipoInventario: number;
  tipoInventario: string | null;
  sucursal: SucursalInventarioFisico;
  estatus: EstatusInventarioFisico;

  constructor(data: Partial<InventarioFisico> = {}) {
    this.idInventarioFisico = data.idInventarioFisico ?? 0;
    this.nombre = data.nombre ?? null;
    this.observaciones = data.observaciones ?? null;
    this.fechaInicio = data.fechaInicio ?? null;
    this.fechaFin = data.fechaFin ?? null;
    this.fechaAlta = data.fechaAlta ?? null;
    this.idTipoInventario = data.idTipoInventario ?? 0;
    this.tipoInventario = data.tipoInventario ?? null;
    this.sucursal = new SucursalInventarioFisicoModel(data.sucursal ?? {});
    this.estatus = new EstatusInventarioFisicoModel(data.estatus ?? {});
  }
}
