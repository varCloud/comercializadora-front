// Filtros del listado de retiros (`GET /api/caja/retiros` y `GET /api/caja/retiros/autorizacion`).
// Mapea `RetirosQuery` de `comercializadora-api` (`Models/Dtos/RetirosQuery.cs`). Sigue el mismo
// patrón que `ListarParams` (`admin/models/shared/listar-params.ts`): interfaz + builder de
// `HttpParams`, sin clase (no es una entidad, es un DTO de query).
//
// NOTA (FE-B5): a diferencia del resto de listados del proyecto, este endpoint NO pagina
// (regresa `Notificacion<IEnumerable<Retiro>>` sin `links`/`meta`) ni acepta texto libre de
// búsqueda — solo estos filtros estructurados. `idEstacion`/`idAlmacen`/`idUsuario` los
// sobrescribe el backend según el rol en `/api/caja/retiros` (filtrado); `/retiros/autorizacion`
// NO sobrescribe nada (sin filtro de rol, ver `CajaController`). Ver `CajaService.obtenerRetiros`
// / `obtenerRetirosAutorizacion` y la memoria `modulo-ventas-bloque-b-fe.md` para el resto del
// razonamiento (paginación/búsqueda quedan client-side, último recurso de la regla 10).

import { HttpParams } from '@angular/common/http';

export interface RetirosFiltro {
  idTipoRetiro?: number | null;
  fecha?: string | null;
  idUsuario?: number | null;
  idAlmacen?: number | null;
}

export function buildRetirosFiltroParams(filtro: RetirosFiltro = {}): HttpParams {
  let params = new HttpParams();
  if (filtro.idTipoRetiro) params = params.set('idTipoRetiro', filtro.idTipoRetiro);
  if (filtro.fecha) params = params.set('fecha', filtro.fecha);
  if (filtro.idUsuario) params = params.set('idUsuario', filtro.idUsuario);
  if (filtro.idAlmacen) params = params.set('idAlmacen', filtro.idAlmacen);
  return params;
}
