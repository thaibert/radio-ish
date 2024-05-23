import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { SpotifyAuth } from '../spotify-auth.service';

@Component({
  selector: 'app-logged-in',
  standalone: true,
  imports: [],
  templateUrl: './logged-in.component.html',
  styleUrl: './logged-in.component.scss'
})
export class LoggedInComponent {

  constructor(
    private readonly spotify: SpotifyAuth,
    private readonly router: Router,
  ) {
    spotify.onAuthorizationResponse(new URLSearchParams(window.location.search)).pipe(
      tap((response) => { if ('success' in response) {
        router.navigate([localStorage.getItem('_returnPath')])
        localStorage.removeItem('_returnPath') 
      }}),
    ).subscribe()
  }

}
