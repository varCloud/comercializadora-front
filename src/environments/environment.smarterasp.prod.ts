// Entorno de producción para SmarterASP.NET (dominio raíz admin-v2.comercializadoralluvia.com).
// ⚠️ PENDIENTE: reemplazar las URLs por la API real en producción.
//    Debe ir por HTTPS: el front se sirve por https://admin-v2.comercializadoralluvia.com,
//    si la API fuera http el navegador bloquea las llamadas (mixed content).
//    Ver memoria `pendiente-urls-backend`.
export const environment = {
  PRODUCTION: true,
  // TODO: URL real de la API (placeholder).
  BASE_URL: 'https://api.comercializadoralluvia.com/api',
  BASE_URL_ADMIN: 'https://api.comercializadoralluvia.com/api',
};
