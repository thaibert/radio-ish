import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyAuth } from '../../spotify-auth.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-login-handle-response',
  standalone: true,
  imports: [],
  template: '',
})
export class LoginHandleResponseComponent {
  constructor(
    spotify: SpotifyAuth,
    router: Router,
  ) {
    spotify.onAuthorizationResponse(new URLSearchParams(window.location.search)).pipe(
      tap((response) => { if ('success' in response) {
        router.navigate([localStorage.getItem('_returnPath')])
        localStorage.removeItem('_returnPath') 
      }}),
    ).subscribe()
  }
}
