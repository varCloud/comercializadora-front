# Estándares de Código - Body Booster Admin Web

## 📝 Comentarios en Código

### ❌ NO Agregar Comentarios Innecesarios

El código debe ser **autodescriptivo**. No añadas comentarios explicando lo obvio.

#### ❌ Evita esto:
```typescript
// Obtener el email del formulario
const email = this.f['email'].value!;

// Crear el payload de login
const payLoad: LoginRequestModel = new LoginRequestModel({
  email: email,
  password: this.f['password'].value!,
  userType: UserTypeEnum.ATHLETE,
});
```

#### ✅ Usa esto:
```typescript
const payLoad: LoginRequestModel = new LoginRequestModel({
  email: this.f['email'].value!,
  password: this.f['password'].value!,
  userType: UserTypeEnum.ATHLETE,
});
```

### ✅ SÍ Agregar Comentarios En Estos Casos:

1. **JSDoc para métodos públicos:**
```typescript
/**
 * Realiza el login del usuario
 * 
 * URL utilizada según el tipo de usuario:
 * - Atletas: BASE_URL
 * - Administrador: BASE_URL_ADMIN
 * 
 * @param request Datos de login
 * @returns Observable con usuario y token
 */
public signIn(request: LoginRequestModel): Observable<{user: UserModel, token: string}> {
  // ...
}
```

2. **Lógica compleja o no obvia:**
```typescript
// Seleccionar la URL según el tipo de usuario
const baseUrl = this.getBaseUrlByUserType(request.userType);
```

3. **Explicar "por qué", no "qué":**
```typescript
// Administrador usa BASE_URL_ADMIN porque requiere acceso a endpoints administrativos
if (userType === UserTypeEnum.ADMIN) {
  return environment.BASE_URL_ADMIN;
}
```

4. **TODO o FIXME:**
```typescript
// TODO: Implementar refresh token cuando expire
// FIXME: Validar respuesta del servidor antes de parsear
```

## 🎯 Principios

- **Nombres claros:** Las variables, funciones y clases deben explicarse por sí solas
- **Type Safety:** TypeScript types documentan el código mejor que comentarios
- **Métodos pequeños:** Un método que hace una cosa no necesita comentarios
- **Consistencia:** Mantén el mismo estilo en todo el proyecto

## 📚 Referencia

- Guía oficial: [Clean Code - Meaningful Names](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- Estándar TypeScript: [TSLint / ESLint Rules](https://typescript-eslint.io/)

---

Última actualización: Mayo 6, 2026
