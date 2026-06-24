import { HttpParams } from '@angular/common/http';
import { CONSTANTS } from 'src/app/config/constants';

/**
 * Parámetros de un listado paginado. `page`/`perPage` para la primera consulta (la navegación
 * posterior usa los links de la API). `q` búsqueda, `order`/`sort` orden. Cualquier llave extra
 * (idRol, idAlmacen, …) se agrega como filtro propio del listado.
 */
export interface ListarParams {
  page?: number;
  perPage?: number;
  q?: string | null;
  order?: string | null;
  sort?: 'asc' | 'desc' | null;
  [extra: string]: string | number | null | undefined;
}

const BASE_KEYS = new Set(['page', 'perPage', 'q', 'order', 'sort']);

/**
 * Construye los HttpParams de un listado (análogo al getParamsRequestProducers del legado):
 * arma page/perPage/q/order/sort y agrega filtros extra no vacíos.
 */
export function buildListParams(opts: ListarParams = {}): HttpParams {
  let params = new HttpParams()
    .set('page', opts.page ?? 1)
    .set('perPage', opts.perPage ?? CONSTANTS.PAGINATION.PAGE_SIZE);

  const q = (opts.q ?? '').toString().trim();
  if (q) {
    params = params.set('q', q);
  }
  if (opts.order) {
    params = params.set('order', opts.order);
  }
  if (opts.sort) {
    params = params.set('sort', opts.sort);
  }

  for (const key of Object.keys(opts)) {
    if (BASE_KEYS.has(key)) continue;
    const value = opts[key];
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      params = params.set(key, value);
    }
  }

  return params;
}
