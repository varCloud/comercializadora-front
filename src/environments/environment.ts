// Entorno de desarrollo: apunta a la API local comercializadora-api (.NET 10).
// Ver memoria `pendiente-urls-backend` para el repunte definitivo de prod/IIS.
export const environment = {
  PRODUCTION: false,
  // API local (HTTP). Para HTTPS usar https://localhost:7285/api.
  BASE_URL: 'http://api.comercializadoralluvia.com/api--',
  BASE_URL_ADMIN: 'http://api.comercializadoralluvia.com/api',
};

