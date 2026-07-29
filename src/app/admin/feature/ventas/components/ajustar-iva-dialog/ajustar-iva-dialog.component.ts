import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize, map } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { NotificationService } from 'src/app/services/notification.service';
import { ENUM_ESTATUS_MODAL, ResultModalModel } from 'src/app/models/result-modal';
import { SelectPaginadoComponent } from 'src/app/admin/shared/components/select-paginado/select-paginado.component';
import { Venta } from 'src/app/admin/models/ventas/venta';
import { FormaPago } from 'src/app/admin/models/ventas/forma-pago';
import { UsoCfdi } from 'src/app/admin/models/ventas/uso-cfdi';
import { GuardarIvaRequestModel } from 'src/app/admin/models/ventas/guardar-iva-request';
import { VentasService } from 'src/app/admin/services/ventas.service';
import { ClientesService } from 'src/app/admin/services/clientes.service';

/** Datos que recibe el modal al abrirse: la venta a la que se le va a ajustar el IVA. */
export interface AjustarIvaDialogData {
  venta: Venta;
}

/**
 * Modal "Ajustar IVA" (FE-C3) — réplica de la edición de datos fiscales antes de facturar
 * (SP_GUARDA_IVA_VENTA). Precarga cliente/forma de pago/IVA actuales de la venta; el cliente
 * usa el mismo selector paginado (regla 16) que el resto de la feature (cobro-dialog).
 */
@Component({
  selector: 'app-ajustar-iva-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TranslatePipe, SelectPaginadoComponent],
  templateUrl: './ajustar-iva-dialog.component.html',
})
export class AjustarIvaDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventasService = inject(VentasService);
  private readonly clientesService = inject(ClientesService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<AjustarIvaDialogComponent>);
  readonly data = inject<AjustarIvaDialogData>(MAT_DIALOG_DATA);

  readonly guardando = signal(false);
  readonly formasPago = signal<FormaPago[]>([]);
  readonly usoCfdiOpciones = signal<UsoCfdi[]>([]);
  readonly clientePreload = signal<unknown[]>([]);

  readonly ivaForm = this.fb.group({
    idCliente: [this.data.venta.idCliente as number | null, Validators.required],
    idFactFormaPago: [this.data.venta.idFactFormaPago as number | null, Validators.required],
    idFactUsoCfdi: [this.data.venta.idFactUsoCFDI as number | null, Validators.required],
    montoIva: [this.data.venta.montoIVA as number | null, [Validators.required, Validators.min(0)]],
  });

  readonly fetchClientes = (q: string, page: number): Observable<unknown[]> =>
    this.clientesService.listar({ q, page, perPage: 25 }).pipe(map((res) => res.data));

  ngOnInit(): void {
    this.ventasService.obtenerFormasPago().subscribe({
      next: (lista) => this.formasPago.set(lista),
      error: (err) => console.error('Error al cargar las formas de pago', err),
    });
    this.ventasService.obtenerUsoCfdi().subscribe({
      next: (lista) => this.usoCfdiOpciones.set(lista),
      error: (err) => console.error('Error al cargar los usos de CFDI', err),
    });

    if (this.data.venta.idCliente) {
      this.clientesService.obtenerPorId(this.data.venta.idCliente).subscribe((cliente) => {
        if (cliente) {
          this.clientePreload.set([cliente]);
        }
      });
    }
  }

  guardar(): void {
    if (this.ivaForm.invalid || this.guardando()) {
      this.ivaForm.markAllAsTouched();
      this.notify.notify('warning', this.translate.instant('ventas.iva.msg.camposRequeridos'));
      return;
    }

    const raw = this.ivaForm.getRawValue();
    const request = new GuardarIvaRequestModel({
      montoIva: Number(raw.montoIva ?? 0),
      idCliente: Number(raw.idCliente ?? 0),
      idFactFormaPago: Number(raw.idFactFormaPago ?? 0),
      idFactUsoCfdi: Number(raw.idFactUsoCfdi ?? 0),
    });

    this.guardando.set(true);
    this.ventasService
      .ajustarIva(this.data.venta.idVenta, request)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (res) => {
          if (res?.estatus === 200) {
            this.notify.notify('success', res.mensaje ?? this.translate.instant('ventas.iva.msg.exito'));
            this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.OK }));
          } else {
            this.notify.notify('error', res?.mensaje ?? this.translate.instant('ventas.iva.msg.error'));
          }
        },
        error: (err) => {
          console.error('Error al ajustar el IVA de la venta', err);
          this.notify.notify('error', this.translate.instant('ventas.iva.msg.error'));
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close(new ResultModalModel({ status: ENUM_ESTATUS_MODAL.CANCEL }));
  }
}
