import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
})
export class AppComponent {
  title = 'Administración';

  private readonly translate = inject(TranslateService);

  constructor() {
    // Idioma por defecto de la app: español. El fallback queda en inglés.
    this.translate.setFallbackLang('en');
    this.translate.use('es');
  }
}
