import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyAuthz } from '../../spotify-authz.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-login-handle-response',
  standalone: true,
  imports: [],
  template: '',
})
export class LoginHandleResponseComponent {
  constructor(
    spotify: SpotifyAuthz,
    router: Router,
  ) {
    spotify.onAuthorizationResponse(new URLSearchParams(window.location.search)).pipe(
      tap((response) => { if ('success' in response) {
        router.navigate([sessionStorage.getItem('_returnPath')])
        sessionStorage.removeItem('_returnPath')
      }}),
    ).subscribe()
  }
}
