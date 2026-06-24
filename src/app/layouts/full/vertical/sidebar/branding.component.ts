import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoreService } from 'src/app/services/core.service';
import { SesionService } from 'src/app/services/sesion.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="branding text-center">
      @if (options.theme === 'light') {
        <a routerLink="/" class="d-flex align-items-center justify-content-center">
          <img
            src="./assets/images/logos/logo_lluvia.png"
            class="align-middle m-2"
            alt="logo"
            height="65"
          />
        </a>
      }
      @if (options.theme === 'dark') {
        <a href="/" class="d-flex align-items-center justify-content-center">
          <img
            src="./assets/images/logos/bodybooster.png"
            class="align-middle m-2"
            alt="logo"
          />
        </a>
      }

      @if (sesion.nombre()) {
        <div class="m-t-8 branding-user">
          <p class="f-s-14 f-w-600 m-0">{{ sesion.nombre() }}</p>
          @if (sesion.rol()) {
            <p class="f-s-12 m-0 text-primary">{{ sesion.rol() }}</p>
          }
          <p class="f-s-12 m-0 text-muted">{{ sesion.usuario() }}</p>
          <p class="f-s-12 m-t-4 m-b-0 text-muted">{{ hoy }}</p>
        </div>
      }
    </div>
  `,
  // Al colapsar el sidebar (clase .sidebarNav-mini en el contenedor) se oculta el
  // bloque de usuario (nombre, rol, usuario, fecha) y queda solo el logo.
  styles: [
    `:host-context(.sidebarNav-mini) .branding-user { display: none; }`,
  ],
})
export class BrandingComponent {
  private readonly settings = inject(CoreService);
  readonly sesion = inject(SesionService);

  options = this.settings.getOptions();

  /** Fecha de hoy en español (ej. "viernes, 20 de junio de 2026"). */
  readonly hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
