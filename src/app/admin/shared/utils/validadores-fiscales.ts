/**
 * Validadores de email/RFC portados literalmente de `js/Index.js` (`validarEmail`,
 * `validarRFC`) del sistema legado — mismas expresiones regulares, para conservar
 * exactamente el mismo criterio de "formato válido" al bloquear la facturación
 * (checkbox "Facturar" del modal de cobro de Ventas).
 */

const EMAIL_REGEX =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

const RFC_REGEX =
  /^(([ÑA-Z|ña-z|&]{3}|[A-Z|a-z]{4})\d{2}((0[1-9]|1[012])(0[1-9]|1\d|2[0-8])|(0[13456789]|1[012])(29|30)|(0[13578]|1[02])31)(\w{2})([A|a|0-9]{1}))$|^(([ÑA-Z|ña-z|&]{3}|[A-Z|a-z]{4})([02468][048]|[13579][26])0229)(\w{2})([A|a|0-9]{1})$/i;

export function validarEmail(valor: string | null | undefined): boolean {
  return EMAIL_REGEX.test(valor ?? '');
}

export function validarRfc(valor: string | null | undefined): boolean {
  return RFC_REGEX.test(valor ?? '');
}
