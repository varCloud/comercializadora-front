import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { BlockUI, BlockUIModule, NgBlockUI } from 'ng-block-ui';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { BitacoraDetalle } from 'src/app/admin/models/bitacoras/bitacora-detalle';
import { BitacorasService } from 'src/app/admin/services/bitacoras.service';

/** Datos de apertura del diálogo: el folio cuyo timeline se muestra. */
export interface BitacoraDetalleData {
  idPedidoInterno: number;
}

/** Paso del timeline decorado con el tiempo transcurrido respecto al paso anterior. */
interface PasoTimeline {
  detalle: BitacoraDetalle;
  transcurrido: string | null;
}

/**
 * Diálogo "Bitácora del pedido interno": línea de tiempo de los cambios de estatus de un folio
 * (fuente PedidosInternosLog vía la API). Migra la vista _DetalleBitacora del legado (que se
 * mostraba como fila expandible); aquí se presenta en un diálogo, consistente con el resto del
 * panel. El tiempo transcurrido entre pasos se calcula en el front (como en el legado).
 */
@Component({
  selector: 'app-bitacora-detalle-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    MatDialogModule,
    TablerIconsModule,
    BlockUIModule,
    TranslatePipe,
    DatePipe,
  ],
  templateUrl: './bitacora-detalle-dialog.component.html',
  styleUrl: './bitacora-detalle-dialog.component.scss',
})
export class BitacoraDetalleDialogComponent implements OnInit {
  private readonly service = inject(BitacorasService);
  readonly data = inject<BitacoraDetalleData>(MAT_DIALOG_DATA);

  @BlockUI('bitacoraDetalle') blockUI!: NgBlockUI;

  readonly pasos = signal<PasoTimeline[]>([]);
  readonly cargado = signal(false);

  /** Chip outline con color determinístico por estatus (mismo criterio que el listado). */
  private readonly estatusPalette = ['#5d87ff', '#13deb9', '#e53935', '#2e7d32', '#7b8893', '#ffae1f'];

  ngOnInit(): void {
    this.blockUI.start();
    this.service
      .obtenerDetalle(this.data.idPedidoInterno)
      .pipe(finalize(() => this.blockUI.stop()))
      .subscribe({
        next: (detalles) => {
          this.pasos.set(this.mapPasos(detalles));
          this.cargado.set(true);
        },
        error: (err) => {
          console.error('Error al cargar el detalle de la bitácora', err);
          this.cargado.set(true);
        },
      });
  }

  estatusColor(idStatus: number): string {
    return this.estatusPalette[Math.abs(idStatus) % this.estatusPalette.length];
  }

  /** Decora cada paso con el tiempo transcurrido respecto al paso anterior (como el legado). */
  private mapPasos(detalles: BitacoraDetalle[]): PasoTimeline[] {
    let fechaAnterior: Date | null = null;
    return detalles.map((detalle) => {
      const fecha = detalle.fechaAlta ? new Date(detalle.fechaAlta) : null;
      const transcurrido =
        fechaAnterior && fecha ? this.formatearTranscurrido(fecha, fechaAnterior) : null;
      fechaAnterior = fecha;
      return { detalle, transcurrido };
    });
  }

  /** Diferencia legible entre dos fechas: "D días, H horas, M minutos, S segundos". */
  private formatearTranscurrido(fecha: Date, anterior: Date): string {
    let delta = Math.max(0, Math.floor((fecha.getTime() - anterior.getTime()) / 1000));
    const dias = Math.floor(delta / 86400);
    delta -= dias * 86400;
    const horas = Math.floor(delta / 3600);
    delta -= horas * 3600;
    const minutos = Math.floor(delta / 60);
    const segundos = delta - minutos * 60;
    return `${dias} días, ${horas} horas, ${minutos} minutos, ${segundos} segundos`;
  }
}
