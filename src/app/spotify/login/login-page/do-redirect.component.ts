import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SpotifyAuthz } from '../../spotify-authz.service';

@Component({
  selector: 'app-login-do-redirect',
  standalone: true,
  imports: [],
  template: '',
})
export class LoginDoRedirectComponent {
  constructor(
    route: ActivatedRoute,
    spotify: SpotifyAuthz,
  ) {
    sessionStorage.setItem('_returnPath', route.snapshot.queryParams['returnPath'])
    spotify.authorize()
  }

}
