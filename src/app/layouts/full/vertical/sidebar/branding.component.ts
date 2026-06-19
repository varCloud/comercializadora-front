import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoreService } from 'src/app/services/core.service';

@Component({
    selector: 'app-branding',
    imports: [NgIf, RouterLink],
    template: `
    <div class="branding">
      @if (options.theme === 'light') {
        <a routerLink="/">
          <div
            style="display: flex; align-items: center; justify-content: center; flex-direction: column;"
          >
            <img
              src="./assets/images/logos/logo_lluvia.png"
              class="align-middle m-2"
              alt="logo"
              height="65"
            />
            <!-- <img  style="width: 100px; height: 65px;"
          src="./assets/images/logos/evalladolid-logo.png"
          class="align-middle m-2"
          alt="logo"
        /> -->
          </div>
        </a>
      }
      @if (options.theme === 'dark') {
        <a href="/">
          <img
            src="./assets/images/logos/bodybooster.png"
            class="align-middle m-2"
            alt="logo"
          />
        </a>
      }
    </div>
  `
})
export class BrandingComponent {
  options = this.settings.getOptions();

  constructor(private settings: CoreService) {}
}
