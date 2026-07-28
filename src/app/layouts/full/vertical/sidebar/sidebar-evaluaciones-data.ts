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
    displayName: 'MPL',
    iconName: 'report-analytics',
    children: [
      {
        displayName: 'MPL Agrupado',
        route: '/admin/consumo-mpl',
      },
      {
        displayName: 'MPL Individual',
        route: '/admin/consumo-mpl-individual',
      },
    ],
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
    displayName: 'Facturas',
    iconName: 'file-invoice',
    children: [
      {
        displayName: 'Ventas',
        route: '/admin/facturas',
      },
      {
        displayName: 'Pedidos especiales',
        route: '/admin/facturas-pedidos-especiales',
      },
    ],
  },
  {
    displayName: 'Reportes',
    iconName: 'report-analytics',
    children: [
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
        displayName: 'Ventas Pedidos Especiales',
        iconName: 'report-money',
        route: '/admin/reportes/ventas-pedidos-especiales',
      },
      {
        displayName: 'Merma',
        iconName: 'trending-down',
        route: '/admin/reportes/merma',
      },
      {
        displayName: 'Devoluciones',
        iconName: 'receipt-refund',
        route: '/admin/reportes/devolucion',
      },
      {
        displayName: 'Compras',
        iconName: 'shopping-bag',
        route: '/admin/reportes/compras',
      },
      {
        displayName: 'Cierres',
        iconName: 'cash',
        route: '/admin/reportes/cierres',
      },
      {
        displayName: 'Cierres Pedidos Especiales',
        iconName: 'cash-banknote',
        route: '/admin/reportes/cierres-pe',
      },
      {
        displayName: 'Margen Bruto',
        iconName: 'chart-infographic',
        route: '/admin/reportes/margen-bruto',
      },
      {
        displayName: 'Días Promedio Inventario',
        iconName: 'rotate-clockwise-2',
        route: '/admin/reportes/dias-promedio-inventario',
      },
      {
        displayName: 'Drop Size',
        iconName: 'droplet',
        route: '/admin/reportes/drop-size',
      },
      {
        displayName: 'Nivel de Servicio Proveedor',
        iconName: 'truck-delivery',
        route: '/admin/reportes/nivel-servicio-proveedor',
      },
      {
        displayName: 'Devoluciones a Proveedor',
        iconName: 'transfer-in',
        route: '/admin/reportes/devoluciones-proveedor',
      },
      {
        displayName: 'Devoluciones Pedidos Especiales',
        iconName: 'transfer-out',
        route: '/admin/reportes/devoluciones-pedidos-especiales',
      },
    ],
  },
];
