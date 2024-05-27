// declare const Spotify: any

import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotifySessionManager } from './spotify/spotify-session-manager.service';
import { Subject, combineLatest, take, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'radio-ish';

  player: any

  constructor(
    private readonly sessionManager: SpotifySessionManager,
    private readonly elementRef: ElementRef,
  ) {}

  ngAfterViewInit(): void {
    console.log("hello world!")

    const script = document.createElement('script')
    script.type = 'text/javascript';
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.id = 'spotify-player'
    script.async = true //false
    script.defer = true
    this.elementRef.nativeElement.appendChild(script)

    const spotifyReady$ = new Subject<void>()
    window.onSpotifyWebPlaybackSDKReady = () => {
      spotifyReady$.next()
    }
    
    combineLatest(
      spotifyReady$,
      this.sessionManager.getAccessToken(),
    ).pipe(
      take(1),
      tap(([, accessToken]) => {
        const player = new Spotify.Player({
          name: 'radio-ish',
          getOAuthToken: cb => { cb(accessToken); },
          volume: 0.5
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            player.activateElement().then(() => {
              player.togglePlay().then(x => console.log("toggle play:", x))
            })
            
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error(message);
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error(message);
        });

        player.addListener('account_error', ({ message }) => {
            console.error(message);
        });

        this.player = player

        player.connect().then(response => console.log("Connected:", response))
      })
    ).subscribe()

  }

  onClick(): void {
    console.log("clicked")
    this.player.getCurrentState().then((x: unknown) => console.log("current state:", x));
  }

}
