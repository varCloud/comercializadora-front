import { NavItem } from './nav-item/nav-item';

// Menú de producto (Comercializadora Lluvia). En producción solo se muestra esto.
// Agrega aquí las rutas de los features bajo /admin.
// Ver .claude/rules/07-menu-navegacion.md
export const navItemsApp: NavItem[] = [
  {
    navCap: 'Administrador',
  },
  {
    displayName: 'Inicio',
    iconName: 'layout-dashboard',
    route: '/admin',
  },
];
