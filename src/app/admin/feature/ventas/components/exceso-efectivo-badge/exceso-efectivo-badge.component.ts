import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ExcesoEfectivo } from 'src/app/admin/models/ventas/exceso-efectivo';
import { CajaService } from 'src/app/admin/services/caja.service';

/**
 * Badge global de "exceso de efectivo" (FE-B4). Réplica visual de `_ExcesoEfectivo.cshtml`
 * (icono de campana + contador) usando el mismo patrón que ya existe en
 * `header.component.html` (`i-tabler name="bell" [matBadge]`) — no se creó un componente de
 * notificación nuevo desde cero, se reutiliza el mismo patrón visual.
 *
 * ⚠️ **Standalone, sin integrar al header todavía.** `header.component.html`
 * (`layouts/full/vertical/header/`) es layout compartido por TODA la app, fuera del feature
 * `ventas`; wirearlo ahí implica una llamada HTTP global (hoy simulada) y no es parte del
 * alcance de FE-B4 (independiente, sin integración real). Queda listo para que FE-B5 (o
 * FE-D2, que agrega el menú de Ventas) lo importe y lo coloque en el header o en el menú.
 */
@Component({
  selector: 'app-exceso-efectivo-badge',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, TranslatePipe, CurrencyPipe],
  templateUrl: './exceso-efectivo-badge.component.html',
})
export class ExcesoEfectivoBadgeComponent implements OnInit {
  private readonly cajaService = inject(CajaService);

  readonly usuariosConExceso = signal<ExcesoEfectivo[]>([]);
  readonly total = computed(() => this.usuariosConExceso().length);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cajaService.obtenerExcesoEfectivo().subscribe({
      next: (lista) => this.usuariosConExceso.set(lista),
      error: (err) => console.error('Error al consultar el exceso de efectivo', err),
    });
  }
}
