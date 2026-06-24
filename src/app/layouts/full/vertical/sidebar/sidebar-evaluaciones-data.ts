import { NavItem } from './nav-item/nav-item';

// Menú de producto (Comercializadora Lluvia). En producción solo se muestra esto.
// Agrega aquí las rutas de los features bajo /admin.
// Ver .claude/rules/07-menu-navegacion.md
export const navItemsApp: NavItem[] = [
  {
    navCap: 'Administrador',
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/admin/dashboard',
  },
  {
    displayName: 'Usuarios',
    iconName: 'users',
    route: '/admin/usuarios',
  },
  {
    displayName: 'Estaciones',
    iconName: 'device-desktop',
    route: '/admin/estaciones',
  },
  {
    displayName: 'Proveedores',
    iconName: 'truck-delivery',
    route: '/admin/proveedores',
  },
  {
    displayName: 'Productos',
    iconName: 'package',
    children: [
      {
        displayName: 'Productos',
        iconName: 'box',
        route: '/admin/productos',
      },
      {
        displayName: 'Líneas de producto',
        iconName: 'list',
        route: '/admin/productos/lineas',
      },
      {
        displayName: 'Imprimir ubicaciones',
        iconName: 'qrcode',
        route: '/admin/productos/imprimir-ubicaciones',
      },
      {
        displayName: 'Códigos de barras',
        iconName: 'barcode',
        route: '/admin/productos/codigos-barras',
      },
      {
        displayName: 'Límites de inventario',
        iconName: 'adjustments',
        route: '/admin/limites-inventario',
      },
    ],
  },
  {
    displayName: 'Compras',
    iconName: 'shopping-cart',
    route: '/admin/compras',
  },
];
