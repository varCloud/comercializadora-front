export const environment = {
    PRODUCTION: true,
  // API local (HTTP). Para HTTPS usar https://localhost:7285/api.
  BASE_URL: 'http://localhost:5163/api',
  BASE_URL_ADMIN: 'http://localhost:5163/api',
  // Agente local de impresión POS: siempre corre en la máquina del navegador de la estación,
  // sin importar contra qué API central hable el front (mismo valor en los 3 environments).
  PRINT_AGENT_URL: 'http://localhost:5090/api/print',
};