import { computed, signal } from '@angular/core';
import {
  EMPTY_LINKS,
  EMPTY_META,
  PageLinks,
  PageMeta,
  PagedResult,
} from './paged-result';

/**
 * Estado de paginación de un listado. Encapsula los datos de la página actual + los `links`
 * (first/last/prev/next) y `meta` que devuelve la API. La navegación NO recompone el número de
 * página: se usa la URL que ya viene en `links`. Una instancia por listado.
 *
 * Uso típico en un componente:
 *   readonly pag = new Paginador<Usuario>();
 *   cargar() { this.service.listar({ perPage: this.pag.perPage(), q }).subscribe(r => this.pag.setPage(r)); }
 *   navegar(url: string) { this.service.irLink<Usuario>(url).subscribe(r => this.pag.setPage(r)); }
 */
export class Paginador<T> {
  /** Filas de la página actual. */
  readonly data = signal<T[]>([]);
  readonly meta = signal<PageMeta>({ ...EMPTY_META });
  readonly links = signal<PageLinks>({ ...EMPTY_LINKS });

  readonly hasPrev = computed(() => !!this.links().prev);
  readonly hasNext = computed(() => !!this.links().next);

  /** Tamaño de página actual (para selector / nueva consulta). */
  readonly perPage = computed(() => this.meta().perPage);
  readonly total = computed(() => this.meta().total);
  readonly isEmpty = computed(() => this.data().length === 0);

  constructor(perPageInicial = 25) {
    this.meta.set({ ...EMPTY_META, perPage: perPageInicial });
  }

  /** Vuelca una respuesta paginada de la API en el estado. */
  setPage(result: PagedResult<T>): void {
    this.data.set(result?.data ?? []);
    this.links.set(result?.links ?? { ...EMPTY_LINKS });
    this.meta.set(result?.meta ?? { ...EMPTY_META });
  }

  /** Devuelve el link de navegación solicitado (o null si no aplica). */
  link(direction: keyof PageLinks): string | null {
    return this.links()[direction];
  }
}
