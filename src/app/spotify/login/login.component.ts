import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SpotifyAuth } from '../spotify-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <p>login works!</p>
  `,
  styles: ['']
})
export class LoginComponent implements AfterViewInit {

  constructor(
    route: ActivatedRoute,
    private readonly spotify: SpotifyAuth,
  ) {
    localStorage.setItem('_returnPath', route.snapshot.queryParams['returnPath'])
  }

  ngAfterViewInit(): void {
    this.spotify.authorize()
  }

}
