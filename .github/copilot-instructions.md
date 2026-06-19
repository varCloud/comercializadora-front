# Instrucciones Copilot - Body Booster Admin Web

## 🎯 Contexto del Proyecto

**Nombre:** Body Booster Admin Web  
**Framework:** Angular (v17+)  
**UI:** Angular Material + Bootstrap Grid  
**API Base:** `https://api.bodybooster.com.mx/api/v1` y `/api/admin/v1`

---

## 🏗️ Arquitectura Fundamental

### Estructura de Carpetas Clave
```
src/
├── app/
│   ├── pages/
│   │   ├── authentication/     ← Componentes de login
│   │   ├── bb-admin/           ← Módulo principal de administración
│   │   └── dashboards/         ← Vistas de dashboards
│   ├── services/               ← Servicios (auth, api calls)
│   ├── models/                 ← Interfaces y modelos de datos
│   ├── guards/                 ← Guards de rutas
│   ├── layouts/                ← Layouts (full, blank)
│   └── config/                 ← Configuraciones (URIs, enums)
├── environments/               ← Variables de entorno
└── assets/                     ← Imágenes, iconos, i18n
```

### Flujos de Autenticación Actuales

**1. Login Administrativo (Existente)**
- Ruta: `/authentication/side-login`
- Componente: `AppSideLoginComponent`
- UserType: `4` (UserTypeEnum.ADMIN)
- URL: `BASE_URL_ADMIN` (api.bodybooster.com.mx/api/admin/v1)
- Destino post-login: `/dashboards/dashboard1` o `/`
- Servicio: `LoginService` → `signIn(LoginRequestModel)`
- Almacenamiento: localStorage (`user`, `token`)
- Parámetro del login: `userType: UserTypeEnum.ADMIN`

**2. Login de Atletas (NUEVO)**
- Ruta: `/authentication/athlete-login`
- Componente: `AppAthleteLoginComponent`
- UserType: `3` (UserTypeEnum.ATHLETE)
- URL: `BASE_URL` (api.bodybooster.com.mx/api/v1) ⭐
- Destino post-login: `/bb-admin/workouts`
- Validación: Verificar `user.Rol.idRol === 3` o `user.Rol.nomRol` contiene "Atleta"
- Servicio: Reutilizar `LoginService`
- Parámetro del login: `userType: UserTypeEnum.ATHLETE`

---

## 📋 Reglas de Desarrollo

### ✅ OBLIGATORIO
1. **Reutilización ante todo:** Clonar componentes existentes en lugar de crear desde cero
   - Ej: Nuevo login → Clonar de `boxed-login` o `side-login`
   - Ej: Nueva tabla → Reutilizar `datatable` de `pages/datatable`
   
2. **Cero CSS innecesario:**
   - Usar clases de Bootstrap Grid (`row`, `col-*`, `d-flex`, `align-items-center`, etc.)
   - Usar clases de Material (`mat-card`, `mat-button`, `mat-form-field`, etc.)
   - Solo escribir SCSS en casos excepcionales (ej: animaciones custom, colores únicos)
   
3. **Componentes Standalone:**
   - Todos los componentes nuevos deben ser `standalone: true`
   - Importar `MaterialModule` desde `app.config.ts` o crear un alias

4. **Autenticación basada en Rol:**
   - Cada login debe validar el tipo de usuario inmediatamente
   - Si rol ≠ esperado → Mostrar error (`NotificationService`) + Limpiar localStorage
   - Usar `auth.guard.ts` para proteger rutas restringidas

5. **Almacenamiento de Datos:**
   - Usuario + Token → localStorage (clave: `user`, `token`)
   - Nunca guardar contraseña en localStorage
   - Recuperar datos con `JSON.parse(localStorage.getItem('user'))`

### ⚠️ NO HACER
- Crear ficheros de estilos global SCSS sin revisar existentes
- Componentes que no sean standalone
- Duplicar código de autenticación (siempre reutilizar `LoginService`)
- Cambios visuales sin consultar el diseño de Material
- **Agregar comentarios innecesarios en archivos** - El código debe ser autodescriptivo a través de nombres claros y tipos TypeScript

---

## 🔐 Roles y Permisos

| Rol             | UserType | Descripción                              | Rutas Permitidas          |
|-----------------|----------|------------------------------------------|--------------------------|
| Usuario         | 1        | Usuario regular de la aplicación         | `/bb-admin/**`            |
| Creator         | 2        | Creador de entrenamientos                | `/bb-admin/creators/**`   |
| Atleta          | 3        | Usuario que consume workouts             | `/bb-admin/workouts`      |
| Admin           | 4        | Acceso administrativo completo           | `/bb-admin/**`            |
| Super User App  | 5        | Súper usuario de la aplicación           | `/`                       |

### Enumeración UserType
Ubicación: `src/app/config/enum.ts`
```typescript
export enum UserTypeEnum {
    USER = 1,
    CREATOR = 2,
    ATHLETE = 3,
    ADMIN = 4,
    SUPER_USER_APP = 5
}
```

**Uso en login:**
```typescript
// Side-login (Administrador)
userType: UserTypeEnum.ADMIN  // = 4

// Athlete-login (Atleta)
userType: UserTypeEnum.ATHLETE  // = 3
```

---

## 🌐 URLs y Endpoints

### URL Bases (Environment)
```typescript
// src/environments/environment.ts
BASE_URL: 'https://api.bodybooster.com.mx/api/v1'           // Atletas y usuarios
BASE_URL_ADMIN: 'https://api.bodybooster.com.mx/api/admin/v1' // Administradores
```

### Selección de URL según Tipo de Usuario
El `LoginService` automáticamente selecciona la URL correcta basándose en el `userType`:

| UserType | Descripción     | URL Utilizada   | Componente       |
|----------|-----------------|-----------------|------------------|
| 3        | Atleta          | `BASE_URL`      | athlete-login    |
| 4        | Administrador   | `BASE_URL_ADMIN`| side-login       |
| Otros    | Otros usuarios  | `BASE_URL`      | -                |

**Implementación en LoginService (`src/app/pages/authentication/services/login.service.ts`):**
```typescript
private getBaseUrlByUserType(userType: number): string {
  // Administrador usa BASE_URL_ADMIN
  if (userType === UserTypeEnum.ADMIN) {
    return environment.BASE_URL_ADMIN;
  }
  // Atletas y otros usuarios usan BASE_URL
  return environment.BASE_URL;
}
```

**IMPORTANTE:** No es necesario especificar la URL en los componentes de login. El servicio la selecciona automáticamente.

---

### LoginService (`src/app/pages/authentication/services/login.service.ts`)
```typescript
signIn(request: LoginRequestModel): Observable<{user: UserModel, token: string}>
```

### CoreService (`src/app/services/core.service.ts`)
```typescript
getOptions()  // Retorna tema actual (light/dark)
```

### NotificationService (`src/app/services/notification.service.ts`, MatSnackBar)
```typescript
notify(type: 'success'|'error'|'warning'|'info'|'default', message: string)
```
> Reemplaza a `angular-notifier` (sin soporte Angular 20). Mantiene la firma `notify(type, message)`.

---

## 📦 Dependencias Importantes

- `@angular/material` → Componentes UI
- `rxjs` → Observables
- `MatSnackBar` (vía `NotificationService`) → Notificaciones
- `ng-block-ui` → Bloqueo de UI durante peticiones
- `@sweetalert2/ngx-sweetalert2` → Modales alertas

---

## 🚀 Pasos para Nuevas Características

1. **Leer esta documentación** ← Estás aquí
2. **Clonar componente similar** (no crear desde cero)
3. **Adaptar lógica y validaciones** (modificar submit, métodos)
4. **Registrar en módulo y routing** (actualizar `*.routing.ts`)
5. **Testear autenticación y rutas** (verificar rol y redirección)

---

## 📝 Notas Importantes

- **Workouts no existe aún:** Crear `src/app/bb-admin/workouts/` cuando se implemente
- **Confirmación de UserType:** Consultar con backend el valor exacto para "Atleta"
- **Logo Body Booster:** Ruta local `assets/images/logos/bodybooster.png`
- **Validación de Rol:** Usar modelo `RolModel` del user para verificar tipo

---

Última actualización: Mayo 6, 2026
