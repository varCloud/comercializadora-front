import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';

// Register the locale data
registerLocaleData(localeEsMx, 'es-MX');

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

// perfect scrollbar
import { NgScrollbarModule } from 'ngx-scrollbar';

//Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//Import Layouts
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';

import { FilterPipe } from './pipe/filter.pipe';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { BlockUIModule } from 'ng-block-ui';
import { BlockComponent } from './pages/ui-components/block/block.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

@NgModule({ declarations: [AppComponent, BlankComponent, FilterPipe],
    exports: [TablerIconsModule],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        BlockUIModule.forRoot({
            template: BlockComponent,
        }),
        MaterialModule,
        TablerIconsModule.pick(TablerIcons),
        NgScrollbarModule,
        FullComponent,
        SweetAlert2Module.forRoot()], providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: LOCALE_ID, useValue: 'es-MX' },
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService({
            fallbackLang: 'en',
            loader: provideTranslateHttpLoader({
                prefix: './assets/i18n/',
                suffix: '.json',
            }),
        }),
    ] })
export class AppModule {}
