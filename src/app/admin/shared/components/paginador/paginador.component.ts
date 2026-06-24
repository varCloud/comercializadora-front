import { Component, input, output } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { CONSTANTS } from 'src/app/config/constants';
import { PageLinks } from 'src/app/admin/models/shared/paged-result';
import { Paginador } from 'src/app/admin/models/shared/paginador';

/**
 * Footer de paginación reutilizable. Navega usando los `links` que devuelve la API (no envía
 * número de página) y permite cambiar el tamaño de página. Emite:
 *  - `navegar`: la URL absoluta a la que ir (first/prev/next/last).
 *  - `perPageChange`: nuevo tamaño de página (el listado debe recargar desde la página 1).
 */
@Component({
  selector: 'app-paginador',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, TranslatePipe],
  templateUrl: './paginador.component.html',
})
export class PaginadorComponent {
  readonly paginador = input.required<Paginador<unknown>>();
  readonly pageSizeOptions = input<number[]>(CONSTANTS.PAGINATION.PAGE_SIZE_OPTIONS);

  readonly navegar = output<string>();
  readonly perPageChange = output<number>();

  irA(direction: keyof PageLinks): void {
    const url = this.paginador().link(direction);
    if (url) {
      this.navegar.emit(url);
    }
  }

  onPerPage(value: number): void {
    this.perPageChange.emit(value);
  }
}
