# Deploy en Render - Instrucciones para Instancia Free

## ✅ Configuración completada
- ✓ `Dockerfile` - Multi-stage optimizado
- ✓ `.dockerignore` - Reduce tamaño de imagen
- ✓ `package.json` - Agregado `serve`

## 🚀 Pasos para Deploy en Render

### 1. Conectar repositorio
- Ve a https://dashboard.render.com
- Click en "New +" → "Web Service"
- Selecciona tu repositorio GitHub

### 2. Configurar servicio
- **Name:** (ej: bb-admin-web)
- **Region:** Ohio (USA) o la más cercana
- **Branch:** main (o la que uses)
- **Runtime:** Docker (detectará automáticamente)

### 3. Variables de Ambiente (si necesitas)
En **Environment** agrega las que uses en tu app:
```
API_URL=https://tu-api.com
```

### 4. Deployment
- Click en "Deploy"
- Espera 3-5 minutos (build + push de imagen)
- Render asignará una URL automáticamente

## ⚠️ Limitaciones de Instancia Free

| Recurso | Limite |
|---------|--------|
| RAM | 0.5 GB |
| CPU | 0.5 vCPU |
| Transferencia | 100 GB/mes |
| Inactividad | Spin-down a los 15 min |

### Optimizaciones aplicadas:
- ✓ Docker multi-stage (solo código compilado en imagen final)
- ✓ .dockerignore (excluye archivos innecesarios)
- ✓ Alpine Linux (base más ligera)
- ✓ Puerto dinámico (Render lo asigna automáticamente)

## 📌 Consideraciones especiales

### Espacio en disco
Si tu build excede 0.5 GB:
1. Revisar node_modules (algunos paquetes son pesados)
2. Usar `npm ci` en lugar de `npm install` (más eficiente)
3. Considerar plan pagado ($7/mes)

### Spin-down
Las instancias free se "duermen" después de 15 min sin tráfico.
- Primera solicitud tardará ~30 segundos
- Es normal en plan free

### Base de datos
Si necesitas BD, usar:
- PostgreSQL free en Render
- MongoDB Atlas free tier
- Render proporciona variables de conexión automáticamente

## 🔄 Flujo de actualización

```bash
# Push a GitHub (main branch)
git add .
git commit -m "configuración para Render"
git push origin main

# Render detectará cambios automáticamente
# Deploy se ejecutará automáticamente
```

## ✨ URL generada
Render te dará una URL como:
```
https://tu-app-name.onrender.com
```

## 🆘 Si hay problemas

Ver logs en Render dashboard:
1. Selecciona tu servicio
2. Pestaña "Logs"
3. Busca errores de build o runtime

### Errores comunes:
- **"Out of memory"** → Necesitas plan pagado o reducir size
- **"Port already in use"** → El Dockerfile ya maneja esto automáticamente
- **"Build failed"** → Revisa los logs, probablemente script de build

---

**Tu proyecto está listo para deploy en Render Free! 🎉**
