/**
 * Devuelve el arreglo sin elementos duplicados según una propiedad identificadora.
 * Se usa para ir acumulando opciones de un selector paginado (ng-select con scroll infinito)
 * sin repetir items entre páginas: `arrayUnique([...actuales, ...nuevos], 'id')`.
 */
export function arrayUnique<T>(array: T[], identifier: string): T[] {
  const a = array.concat();
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if ((a[i] as Record<string, unknown>)[identifier] === (a[j] as Record<string, unknown>)[identifier]) {
        a.splice(j--, 1);
      }
    }
  }
  return a;
}
