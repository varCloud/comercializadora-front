import { PagedResult } from 'src/app/admin/models/shared/paged-result';

/**
 * Pagina en el cliente un arreglo ya cargado por completo, devolviendo el mismo shape
 * `PagedResult<T>` que consume `Paginador<T>`/`app-paginador` para listados paginados
 * server-side (regla 10). Último recurso: se usa solo cuando el endpoint no pagina — ver
 * `ReportesCierresService` (`SP_CONSULTA_CIERRES_DIA` no implementa `OFFSET/FETCH` y
 * `ReportesCierresController` documenta la decisión de no paginar por ahora).
 *
 * `links.first/prev/next/last` NO son URLs reales: son el número de página destino como string.
 * El componente que consuma esto debe interpretar `navegar(url)` con `Number(url)` en vez de
 * hacer un GET a esa "URL" (ver `CierreListComponent.navegar`).
 */
export function paginarCliente<T>(all: T[], page: number, perPage: number): PagedResult<T> {
  const total = all.length;
  const size = Math.max(1, perPage);
  const lastPage = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const start = (currentPage - 1) * size;
  const data = all.slice(start, start + size);

  return {
    data,
    links: {
      first: currentPage > 1 ? '1' : null,
      prev: currentPage > 1 ? String(currentPage - 1) : null,
      next: currentPage < lastPage ? String(currentPage + 1) : null,
      last: currentPage < lastPage ? String(lastPage) : null,
    },
    meta: {
      currentPage,
      from: total === 0 ? null : start + 1,
      lastPage,
      path: '',
      perPage: size,
      to: total === 0 ? null : start + data.length,
      total,
    },
  };
}
