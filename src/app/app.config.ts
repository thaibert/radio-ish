import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routesForRouter } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { StoreModule, provideStore } from '@ngrx/store';
import { EffectsModule, provideEffects } from '@ngrx/effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routesForRouter),
    provideHttpClient(),
    provideStore(),
    importProvidersFrom(StoreModule.forRoot()),
    provideEffects(),
    importProvidersFrom(EffectsModule.forRoot()),
]
};
