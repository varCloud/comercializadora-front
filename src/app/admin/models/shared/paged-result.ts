// Resultado paginado estilo Laravel que devuelve la API: { data, links, meta }.
// El front navega usando `links` (first/last/prev/next), no recomponiendo el número de página.
// Llaves camelCase (política de la API). Ver clase Paginador para el manejo de estado.

export interface PageLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PageMeta {
  currentPage: number;
  from: number | null;
  lastPage: number;
  path: string;
  perPage: number;
  to: number | null;
  total: number;
}

export interface PagedResult<T> {
  data: T[];
  links: PageLinks;
  meta: PageMeta;
}

export const EMPTY_LINKS: PageLinks = { first: null, last: null, prev: null, next: null };

export const EMPTY_META: PageMeta = {
  currentPage: 1,
  from: null,
  lastPage: 1,
  path: '',
  perPage: 0,
  to: null,
  total: 0,
};
