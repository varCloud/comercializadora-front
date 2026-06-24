import { Component, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import * as XLSX from 'xlsx';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import {
  ENUM_ESTATUS_MODAL,
  ResultModalModel,
} from 'src/app/models/result-modal';
import {
  LimiteExcelRow,
  LimiteExcelRowModel,
} from 'src/app/admin/models/limites-inventario/limite-excel-row';
import { LimiteMasivoItemModel } from 'src/app/admin/models/limites-inventario/limite-masivo-item';
import { LimitesInventarioService } from 'src/app/admin/services/limites-inventario.service';

/** Encabezados exactos que debe traer el archivo (mismo formato que el legado). */
const HEADERS = ['Codigo Barras', 'Almacen', 'Minimo', 'Maximo'];

@Component({
  selector: 'app-importar-excel-dialog',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, TranslatePipe],
  templateUrl: './importar-excel-dialog.component.html',
  styleUrl: './importar-excel-dialog.component.scss',
})
export class ImportarExcelDialogComponent {
  private readonly service = inject(LimitesInventarioService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<ImportarExcelDialogComponent>);

  readonly filas = signal<LimiteExcelRow[]>([]);
  readonly nombreArchivo = signal('');
  readonly saving = signal(false);

  readonly displayedColumns = ['codigoBarras', 'descripcionAlmacen', 'minimo', 'maximo', 'estatus'];

  /** Lee el archivo seleccionado, lo parsea con SheetJS y arma la previsualización. */
  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      this.notify.notify('error', this.translate.instant('limitesInventario.import.invalidFile'));
      input.value = '';
      return;
    }

    this.nombreArchivo.set(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
        this.procesar(rows);
      } catch (err) {
        console.error('Error al leer el Excel', err);
        this.notify.notify('error', this.translate.instant('limitesInventario.import.readError'));
      } finally {
        input.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /** Valida encabezados y arma las filas con su estatus (Correcto/Incorrecto). */
  private procesar(rows: unknown[][]): void {
    this.filas.set([]);

    if (!rows.length) {
      this.notify.notify('error', this.translate.instant('limitesInventario.import.empty'));
      return;
    }

    const encabezados = (rows[0] ?? []).map((c) => (c ?? '').toString().trim());
    const formatoOk = HEADERS.every((h, i) => encabezados[i] === h);
    if (!formatoOk) {
      this.notify.notify('error', this.translate.instant('limitesInventario.import.badFormat'));
      return;
    }

    const filas: LimiteExcelRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const codigoBarras = (row[0] ?? '').toString().trim();
      const descripcionAlmacen = (row[1] ?? '').toString().trim();
      const minimoStr = (row[2] ?? '').toString().trim();
      const maximoStr = (row[3] ?? '').toString().trim();

      const minimo = parseInt(minimoStr, 10);
      const maximo = parseInt(maximoStr, 10);

      let mensaje = '';
      if (!codigoBarras || !descripcionAlmacen || minimoStr === '' || maximoStr === '') {
        mensaje = this.translate.instant('limitesInventario.import.rowEmpty');
      } else if (!Number.isInteger(minimo) || !Number.isInteger(maximo)) {
        mensaje = this.translate.instant('limitesInventario.import.rowNotInteger');
      } else if (minimo > maximo) {
        mensaje = this.translate.instant('limitesInventario.import.rowMinGtMax');
      }

      filas.push(
        new LimiteExcelRowModel({
          codigoBarras,
          descripcionAlmacen,
          minimo: Number.isNaN(minimo) ? 0 : minimo,
          maximo: Number.isNaN(maximo) ? 0 : maximo,
          valido: mensaje === '',
          mensaje: mensaje || this.translate.instant('limitesInventario.import.rowOk'),
        }),
      );
    }

    this.filas.set(filas);
  }

  /** Envía TODAS las filas (como el legado); el SP decide qué afecta. */
  guardar(): void {
    const filas = this.filas();
    if (!filas.length) {
      this.notify.notify('warning', this.translate.instant('limitesInventario.import.noData'));
      return;
    }

    const items = filas.map(
      (f) =>
        new LimiteMasivoItemModel({
          codigoBarras: f.codigoBarras,
          descripcionAlmacen: f.descripcionAlmacen,
          minimo: f.minimo,
          maximo: f.maximo,
        }),
    );

    this.saving.set(true);
    this.service
      .guardarMasivo(items)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? '');
            this.dialogRef.close(
              new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK, message: res.mensaje }),
            );
          } else {
            this.notify.notify(
              'error',
              res?.mensaje ?? this.translate.instant('limitesInventario.import.saveFallback'),
            );
          }
        },
        error: (err) => {
          console.error('Error al importar límites', err);
          this.notify.notify('error', this.translate.instant('limitesInventario.import.saveError'));
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
