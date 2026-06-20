# Regla 09 — Modelos: interface + clase

**Cada vez que crees una `interface` de datos, crea también su `class` que la implemente.**
La interface define el contrato (tipado de las respuestas/payloads); la clase da una
instancia construible con valores por defecto y normalización.

## Patrón

```ts
export interface User {
  id: number;
  nombre: string;
}

export class UserModel implements User {
  id: number;
  nombre: string;

  constructor(data: Partial<User> = {}) {
    this.id = data.id ?? 0;
    this.nombre = data.nombre ?? '';
  }
}
```

Ejemplo real en el repo: `models/sesion.ts` (`Sesion`/`SesionModel`, `Permiso`/`PermisoModel`).

## Cómo aplicar

- Nombra la interface con el concepto (`Cliente`, `Sesion`) y la clase con sufijo `Model`
  (`ClienteModel`, `SesionModel`).
- El constructor recibe `Partial<T>` y aplica defaults (`?? 0`, `?? ''`, `?? null`, `?? []`);
  para listas de sub-entidades, mapéalas a su `*Model` (`(data.permisos ?? []).map(p => new PermisoModel(p))`).
- **Usa la clase al materializar respuestas HTTP**: en el `map` del servicio devuelve
  `new XModel(response.modelo)`, no el objeto plano. Así el componente recibe una instancia
  consistente.
- Tipa con la **interface** en firmas y propiedades; **instancia** con la clase.
- Los nombres de campo replican el **contrato JSON de la API (camelCase)**; no los anglifiques
  si el back los expone en español (excepción documentada a la regla `03-idioma.md`).
