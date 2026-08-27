// Entorno de desarrollo: apunta a la API local comercializadora-api (.NET 10).
// Ver memoria `pendiente-urls-backend` para el repunte definitivo de prod/IIS.
export const environment = {
  PRODUCTION: false,
  // API local (HTTP). Para HTTPS usar https://localhost:7285/api
  BASE_URL: 'http://api.comercializadoralluvia.com/api',
  BASE_URL_ADMIN: 'https://localhost:7285/api',
  // Agente local de impresión POS: siempre corre en la máquina del navegador de la estación,
  // sin importar contra qué API central hable el front (mismo valor en los 3 environments).
  PRINT_AGENT_URL: 'http://localhost:5090/api/print',
};

