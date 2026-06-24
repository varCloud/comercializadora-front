import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { DashboardKpis } from 'src/app/admin/models/dashboard/dashboard-kpis';
import { Categoria } from 'src/app/admin/models/dashboard/categoria';
import { EstacionVenta } from 'src/app/admin/models/dashboard/venta-estacion';
import { DashboardService } from 'src/app/admin/services/dashboard.service';

/** Configuración de una gráfica de columnas ApexCharts. */
interface ColumnChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  colors: string[];
}

/** Periodos para la gráfica de ventas por fecha. */
const PERIODO_SEMANA = 1;
const PERIODO_MES = 2;
const PERIODO_ANIO = 3;
const PERIODO_DIA = 4;

/** Tipos de Top Ten (contrato API: EnumTipoGrafico). */
const TIPO_PRODUCTOS = 2;
const TIPO_CLIENTES = 3;
const TIPO_PROVEEDORES = 4;

/** Tarjeta KPI con el estilo de `components/dashboard1/top-cards` (bg-light-* + icono SVG). */
interface KpiCard {
  color: 'primary' | 'accent' | 'warning' | 'error' | 'success';
  img: string;
  title: string;
  value: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MaterialModule,
    NgApexchartsModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    CurrencyPipe,
    DecimalPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @BlockUI('dashboard') blockUI!: NgBlockUI;
  @ViewChild('ventasChart') ventasChart?: ChartComponent;

  /** Opciones del selector de periodo (valores = contrato API). */
  readonly periodos = [
    { value: PERIODO_SEMANA, labelKey: 'dashboard.periodo.semana' },
    { value: PERIODO_MES, labelKey: 'dashboard.periodo.mes' },
    { value: PERIODO_ANIO, labelKey: 'dashboard.periodo.anio' },
  ];

  /** Selector de periodo para los Top (incluye "Día", como el legado). */
  readonly periodosTop = [
    { value: PERIODO_DIA, labelKey: 'dashboard.periodo.dia' },
    { value: PERIODO_SEMANA, labelKey: 'dashboard.periodo.semana' },
    { value: PERIODO_MES, labelKey: 'dashboard.periodo.mes' },
    { value: PERIODO_ANIO, labelKey: 'dashboard.periodo.anio' },
  ];

  // Estado reactivo.
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly periodo = signal(PERIODO_MES);
  readonly categorias = signal<Categoria[]>([]);

  /**
   * Tarjetas KPI con el estilo `top-cards` de dashboard1. Se derivan de los KPIs:
   * ventas por periodo + información global + merma y costo (actual/anterior).
   */
  readonly topCards = computed<KpiCard[]>(() => {
    const k = this.kpis();
    if (!k) return [];

    const cards: KpiCard[] = [
      { color: 'primary', img: '/assets/images/svgs/icon-dd-cart.svg', title: this.t('dashboard.kpis.ventasDia'), value: this.money(k.ventasDia) },
      { color: 'warning', img: '/assets/images/svgs/icon-dd-date.svg', title: this.t('dashboard.kpis.ventasSemana'), value: this.money(k.ventasSemana) },
      { color: 'accent', img: '/assets/images/svgs/icon-dd-invoice.svg', title: this.t('dashboard.kpis.ventasMes'), value: this.money(k.ventasMes) },
      { color: 'success', img: '/assets/images/svgs/icon-pie.svg', title: this.t('dashboard.kpis.ventasAnio'), value: this.money(k.ventasAnio) },
    ];

    // Información global (Compras del día, Nuevos clientes, …): id 3 = conteo, resto = moneda.
    for (const c of k.informacionGlobal ?? []) {
      cards.push({
        color: 'accent',
        img: '/assets/images/svgs/icon-briefcase.svg',
        title: c.categoria,
        value: c.id === 3 ? this.num(c.total) : this.money(c.total),
      });
    }

    if (k.mermaActual) {
      cards.push({ color: 'error', img: '/assets/images/svgs/icon-favorites.svg', title: this.t('dashboard.merma.actual'), value: `${this.money(k.mermaActual.totalCostoMerma)} · ${this.num(k.mermaActual.totalPorcMerma)}%` });
    }
    if (k.mermaAnterior) {
      cards.push({ color: 'error', img: '/assets/images/svgs/icon-favorites.svg', title: this.t('dashboard.merma.anterior'), value: `${this.money(k.mermaAnterior.totalCostoMerma)} · ${this.num(k.mermaAnterior.totalPorcMerma)}%` });
    }
    if (k.costoProduccionActual) {
      cards.push({ color: 'accent', img: '/assets/images/svgs/icon-office-bag.svg', title: this.t('dashboard.costo.actual'), value: `${this.money(k.costoProduccionActual.totalCostoProduccion)} · ${this.num(k.costoProduccionActual.totalPorcCostoProduccion)}%` });
    }
    if (k.costoProduccionAnterior) {
      cards.push({ color: 'success', img: '/assets/images/svgs/icon-office-bag.svg', title: this.t('dashboard.costo.anterior'), value: `${this.money(k.costoProduccionAnterior.totalCostoProduccion)} · ${this.num(k.costoProduccionAnterior.totalPorcCostoProduccion)}%` });
    }

    return cards;
  });

  // Drilldown por estación de la categoría seleccionada.
  readonly estacionSeleccionada = signal<Categoria | null>(null);
  readonly estaciones = signal<EstacionVenta[]>([]);

  // Fase 2: lista de ventas por estación (totales globales) y Top clientes/productos/proveedores.
  readonly estacionesCols = ['nombre', 'dia', 'semana', 'mes', 'anio'];
  readonly estacionesLista = signal<EstacionVenta[]>([]);
  readonly topProductos = signal<Categoria[]>([]);
  readonly topClientes = signal<Categoria[]>([]);
  readonly topProveedores = signal<Categoria[]>([]);
  readonly periodoProductos = signal(PERIODO_ANIO);
  readonly periodoClientes = signal(PERIODO_ANIO);
  readonly periodoProveedores = signal(PERIODO_ANIO);

  // Configuración de las gráficas (se rellena al cargar datos).
  ventasOptions: Partial<ColumnChart> = this.buildVentasChart([]);
  estacionesOptions: Partial<ColumnChart> = this.buildEstacionesChart([]);

  ngOnInit(): void {
    this.cargarKpis();
    this.cargarVentasPorFecha();
    this.cargarEstacionesLista();
    this.cargarTopProductos();
    this.cargarTopClientes();
    this.cargarTopProveedores();
  }

  cargarKpis(): void {
    this.blockUI.start(this.translate.instant('dashboard.msg.loading'));
    this.service
      .obtenerKpis()
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => this.kpis.set(res),
        error: (err) => {
          console.error('Error al obtener KPIs del dashboard', err);
          this.notify.notify('error', this.translate.instant('dashboard.msg.kpisError'));
        },
      });
  }

  cargarVentasPorFecha(): void {
    this.blockUI.start(this.translate.instant('dashboard.msg.loading'));
    // Al recargar la serie principal, limpia el drilldown previo.
    this.estacionSeleccionada.set(null);
    this.estaciones.set([]);
    this.service
      .obtenerVentasPorFecha(this.periodo())
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          this.categorias.set(res.categorias);
          this.ventasOptions = this.buildVentasChart(res.categorias);
        },
        error: (err) => {
          console.error('Error al obtener ventas por fecha', err);
          this.notify.notify('error', this.translate.instant('dashboard.msg.ventasError'));
        },
      });
  }

  onPeriodoChange(value: number): void {
    this.periodo.set(value);
    this.cargarVentasPorFecha();
  }

  /** Drilldown: al clicar una columna carga el desglose por estación de esa categoría. */
  onColumnSelected(dataPointIndex: number): void {
    const categoria = this.categorias()[dataPointIndex];
    if (!categoria) return;
    this.estacionSeleccionada.set(categoria);
    this.blockUI.start(this.translate.instant('dashboard.msg.loading'));
    this.service
      .obtenerVentasPorEstacion(categoria.fechaIni, categoria.fechaFin)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (res) => {
          this.estaciones.set(res);
          this.estacionesOptions = this.buildEstacionesChart(res);
        },
        error: (err) => {
          console.error('Error al obtener ventas por estación', err);
          this.notify.notify('error', this.translate.instant('dashboard.msg.estacionesError'));
        },
      });
  }

  /** Fase 2: lista de ventas por estación con totales globales (sin rango de fechas). */
  cargarEstacionesLista(): void {
    this.service
      .obtenerVentasPorEstacion()
      .subscribe({
        next: (res) => this.estacionesLista.set(res),
        error: (err) => {
          console.error('Error al obtener ventas por estación (lista)', err);
          this.notify.notify('error', this.translate.instant('dashboard.msg.estacionesError'));
        },
      });
  }

  cargarTopProductos(): void {
    this.cargarTop(this.periodoProductos(), TIPO_PRODUCTOS, this.topProductos);
  }

  cargarTopClientes(): void {
    this.cargarTop(this.periodoClientes(), TIPO_CLIENTES, this.topClientes);
  }

  cargarTopProveedores(): void {
    this.cargarTop(this.periodoProveedores(), TIPO_PROVEEDORES, this.topProveedores);
  }

  onPeriodoProductosChange(value: number): void {
    this.periodoProductos.set(value);
    this.cargarTopProductos();
  }

  onPeriodoClientesChange(value: number): void {
    this.periodoClientes.set(value);
    this.cargarTopClientes();
  }

  onPeriodoProveedoresChange(value: number): void {
    this.periodoProveedores.set(value);
    this.cargarTopProveedores();
  }

  /** Carga un Top (productos/clientes/proveedores) y vuelca el resultado en su signal. */
  private cargarTop(
    periodo: number,
    tipo: number,
    destino: { set: (v: Categoria[]) => void },
  ): void {
    this.service.obtenerTopTen(periodo, tipo).subscribe({
      next: (res) => destino.set(res),
      error: (err) => {
        console.error('Error al obtener Top Ten', err);
        this.notify.notify('error', this.translate.instant('dashboard.msg.topError'));
      },
    });
  }

  private buildVentasChart(categorias: Categoria[]): Partial<ColumnChart> {
    const self = this;
    return {
      series: [
        { name: this.translate.instant('dashboard.chart.ventas'), data: categorias.map((c) => c.total) },
        { name: this.translate.instant('dashboard.chart.ventasPE'), data: categorias.map((c) => c.totalPE) },
      ],
      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 360,
        events: {
          dataPointSelection: (_event, _ctx, config) => {
            self.onColumnSelected(config.dataPointIndex);
          },
        },
      },
      colors: ['#5d87ff', '#49beff'],
      plotOptions: {
        bar: { horizontal: false, columnWidth: '40%', borderRadius: 6 },
      },
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: true, position: 'top' },
      grid: { borderColor: 'rgba(0,0,0,0.1)', strokeDashArray: 3 },
      yaxis: { labels: { formatter: (v: number) => self.formatCurrency(v) } },
      xaxis: {
        categories: categorias.map((c) => c.categoria),
        axisBorder: { show: false },
      },
      tooltip: {
        theme: 'dark',
        y: { formatter: (v: number) => self.formatCurrency(v) },
      },
    };
  }

  private buildEstacionesChart(estaciones: EstacionVenta[]): Partial<ColumnChart> {
    const self = this;
    return {
      series: [
        {
          name: this.translate.instant('dashboard.chart.ventaDia'),
          data: estaciones.map((e) => e.montoTotalDia),
        },
      ],
      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: { show: false },
        height: 320,
      },
      colors: ['#13deb9'],
      plotOptions: {
        bar: { horizontal: true, borderRadius: 6, barHeight: '50%' },
      },
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { borderColor: 'rgba(0,0,0,0.1)', strokeDashArray: 3 },
      yaxis: {},
      xaxis: {
        categories: estaciones.map((e) => e.nombre),
        labels: { formatter: (v: string) => self.formatCurrency(Number(v)) },
        axisBorder: { show: false },
      },
      tooltip: {
        theme: 'dark',
        y: { formatter: (v: number) => self.formatCurrency(v) },
      },
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  /** Alias semántico de formatCurrency para las tarjetas KPI. */
  private money(value: number): string {
    return this.formatCurrency(value);
  }

  /** Formatea un número con hasta 2 decimales (conteos, porcentajes). */
  private num(value: number): string {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value ?? 0);
  }

  /** Atajo de traducción para construir las tarjetas en el computed. */
  private t(key: string): string {
    return this.translate.instant(key);
  }
}
