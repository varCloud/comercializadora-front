# Regla 11 — Organización de modelos por feature

Los modelos del panel viven en `src/app/admin/models/` organizados así:

- **Una carpeta por feature:** `admin/models/<feature>/` (ej. `admin/models/usuarios/`).
  Ahí va todo lo referente a esa feature: interfaces, modelos, requests, responses.
- **Genéricos/transversales** (usados por varias features): `admin/models/shared/`
  (ej. `paged-result.ts`, `catalogo.ts`).

## Un archivo = una interfaz + su modelo

- **Cada archivo contiene UNA sola interfaz** y su clase `*Model` que la implementa.
  Nunca dos interfaces en el mismo archivo.
- Nombre del archivo en `kebab-case` según el concepto: `usuario.ts`,
  `guardar-usuario-request.ts`.
- Siempre la **interfaz + su modelo** juntos (regla 09): la interfaz es el contrato; la
  clase `XModel implements X` da defaults y se usa al materializar respuestas (`new XModel(...)`).

```
admin/models/
├── shared/
│   ├── paged-result.ts        # PagedResult<T> + PagedResultModel<T>
│   └── catalogo.ts            # Catalogo + CatalogoModel
└── usuarios/
    ├── usuario.ts             # Usuario + UsuarioModel
    └── guardar-usuario-request.ts  # GuardarUsuarioRequest + GuardarUsuarioRequestModel
```

Complementa la regla 09 (interface + clase).
