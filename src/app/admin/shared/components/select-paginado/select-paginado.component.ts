import { Component, OnInit, ViewChild, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { arrayUnique } from 'src/app/admin/shared/utils/array-unique';
import { MaterialModule } from "src/app/material.module";

/**
 * Selector ng-select **paginado en scroll** para catálogos que pintan más de 25 opciones desde el
 * inicio (regla 16). Carga la primera página al abrir, pide la siguiente al hacer `scrollToEnd` y
 * va **acumulando sin duplicar** con `arrayUnique`. La búsqueda es server-side (`(search)`).
 *
 * El padre solo provee `fetchPage(q, page) => Observable<items[]>` y el `FormControl`:
 *   <app-select-paginado [control]="$any(form.controls.x)" [fetchPage]="fetchX"
 *       bindLabel="descripcion" bindValue="id" identifier="id" [preload]="seedX()" />
 */
@Component({
  selector: 'app-select-paginado',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule, TranslatePipe, MaterialModule],
  templateUrl: './select-paginado.component.html',
})
export class SelectPaginadoComponent implements OnInit {
  @ViewChild('select', { read: NgSelectComponent }) private select!: NgSelectComponent;

  /** FormControl del formulario padre (reactive). */
  readonly control = input.required<FormControl>();
  /** Función que trae una página del catálogo desde el server. */
  readonly fetchPage = input.required<(q: string, page: number) => Observable<unknown[]>>();

  readonly identifier = input('id');
  readonly bindLabel = input('descripcion');
  /** Propiedad a guardar en el form; vacío = se guarda el objeto completo. */
  readonly bindValue = input('');
  readonly placeholder = input('');
  readonly pageSize = input(25);
  readonly multiple = input(false);
  readonly clearable = input(true);
  readonly closeOnSelect = input(true);
  readonly searchable = input(true);
  
  /** Items para sembrar la selección actual en edición (para que el ng-select la muestre). */
  readonly preload = input<unknown[]>([]);

  readonly selected = output<unknown>();

  readonly items = signal<unknown[]>([]);
  readonly loading = signal(false);

  private page = 1;
  private term = '';
  private hasMore = true;
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.items.set([...(this.preload() ?? [])]);

    this.search$.pipe(debounceTime(500), distinctUntilChanged()).subscribe((term) => {
      this.term = term ?? '';
      this.page = 1;
      this.hasMore = true;
      this.cargar();
    });

    this.cargar(); // primera página al iniciar
  }

  onSearch(event: { term: string }): void {
    this.search$.next(event?.term ?? '');
  }

  onScrollEnd(): void {
    if (this.loading() || !this.hasMore) return;
    this.page++;
    this.cargar();
  }

  /** ng-select no filtra en cliente: el server ya filtra (búsqueda paginada). */
  readonly noClientFilter = (): boolean => true;

  private cargar(): void {
    this.loading.set(true);
    this.fetchPage()(this.term, this.page)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const nuevos = res ?? [];
          this.hasMore = nuevos.length >= this.pageSize();
          const base = this.page === 1 ? nuevos : [...this.items(), ...nuevos];
          this.items.set(arrayUnique([...(this.preload() ?? []), ...base], this.identifier()));
        },
        error: () => (this.hasMore = false),
      });
  }

  

  // Métodos públicos para controlar el select
  openSelect(): void {
    this.select?.open();
  }

  closeSelect(): void {
    this.select?.close();
  }

  toggleSelect(): void {
    this.select?.toggle();
  }

  focusSelect(): void {
    this.select?.focus();
  }
}
