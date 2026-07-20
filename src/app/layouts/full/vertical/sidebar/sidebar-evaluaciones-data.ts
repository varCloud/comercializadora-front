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
    displayName: 'Clientes',
    iconName: 'users',
    children: [
      {
        displayName: 'Clientes',
        iconName: 'user',
        route: '/admin/clientes',
      },
      {
        displayName: 'Tipos de cliente',
        iconName: 'discount-2',
        route: '/admin/clientes/tipos',
      },
    ],
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
        displayName: 'Relación Liquidos',
        iconName: 'droplet',
        route: '/admin/relacion-liquidos',
      },
      {
        displayName: 'Relación Trapeadores',
        iconName: 'bucket-droplet',
        route: '/admin/relacion-trapeadores',
      },
      {
        displayName: 'Límites de inventario',
        iconName: 'adjustments',
        route: '/admin/limites-inventario',
      },
    ],
  },
  {
    displayName: 'Producción a granel',
    iconName: 'flask',
    route: '/admin/produccion-agranel',
  },
  {
    displayName: 'Consumo de MPL',
    iconName: 'report-analytics',
    route: '/admin/consumo-mpl',
  },
  {
    displayName: 'Producción líquidos',
    iconName: 'droplet',
    route: '/admin/produccion-liquidos',
  },
  {
    displayName: 'Producción trapeadores',
    iconName: 'wash',
    route: '/admin/produccion-trapeadores',
  },
  {
    displayName: 'Compras',
    iconName: 'shopping-cart',
    route: '/admin/compras',
  },
  {
    displayName: 'Inventario físico',
    iconName: 'clipboard-list',
    route: '/admin/inventario-fisico',
  },
  {
    displayName: 'Bitácoras',
    iconName: 'timeline',
    route: '/admin/bitacoras',
  },
  {
    displayName: 'Facturas Ventas',
    iconName: 'file-invoice',
    route: '/admin/facturas',
  },
  {
    displayName: 'Facturas Pedidos Esp',
    iconName: 'file-star',
    route: '/admin/facturas-pedidos-especiales',
  },
  {
    navCap: 'Reportes',
  },
  {
    displayName: 'Inventario',
    iconName: 'report',
    route: '/admin/reportes/inventario',
  },
  {
    displayName: 'Ventas',
    iconName: 'report-money',
    route: '/admin/reportes/ventas',
  },
  {
    displayName: 'Merma',
    iconName: 'trending-down',
    route: '/admin/reportes/merma',
  },
];
