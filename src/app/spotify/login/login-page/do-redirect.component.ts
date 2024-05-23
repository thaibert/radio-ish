import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SpotifyAuth } from '../../spotify-auth.service';

@Component({
  selector: 'app-login-do-redirect',
  standalone: true,
  imports: [],
  template: '',
})
export class LoginDoRedirectComponent {
  constructor(
    route: ActivatedRoute,
    spotify: SpotifyAuth,
  ) {
    localStorage.setItem('_returnPath', route.snapshot.queryParams['returnPath'])
    spotify.authorize()
  }

}
