import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateRandomString, sha256, spotifyBase64encode } from './auth-utils';
import { Observable, map, of, tap } from 'rxjs';
import { SpotifySessionManager } from './spotify-session-manager.service';

type AuthorizationResponse = {success: true} | {error: string}

@Injectable({
  providedIn: 'root'
})
export class SpotifyAuthz {

  // TODO: session/local storage management. What if not available?

  constructor(
    private readonly http: HttpClient,
    private readonly sessionManager: SpotifySessionManager,
  ) {}

  public authorize(): void {
    (async () => {
      const code_verifier = generateRandomString(64)
      sessionStorage.setItem('code_verifier', code_verifier)
      const code_challenge = spotifyBase64encode(await sha256(code_verifier))
  
      const client_id = '1a5bd89e7ec24bfa8b7277c907983033' // TODO env file
      const scope = [ // TODO parameterise this out
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-modify-playback-state',
      ].join(' ')
  
      const url = new URL('https://accounts.spotify.com/authorize')
      const params = {
        response_type: 'code',
        client_id: client_id,
        redirect_uri: constructRedirectUri(),
        scope: scope,
        // state: state,
        code_challenge_method: 'S256',
        code_challenge: code_challenge,
      }
  
      url.search = new URLSearchParams(params).toString()
      window.location.href = url.toString()  
    })()
  }

  public onAuthorizationResponse(queryParams: URLSearchParams): Observable<AuthorizationResponse> {
    // TODO: include state in authorize calls
    type SpotifyAuthorizeResponse = {code: string/*, state: string*/} | {error: string/*, state: string*/}
    const onAuthorize = (response: SpotifyAuthorizeResponse): Observable<AuthorizationResponse> => {
      if ('error' in response) {
        console.error(response.error)
        return of({ error: response.error })
      }
      
      const url = 'https://accounts.spotify.com/api/token'
      const body: Record<string, string> = {
        grant_type: 'authorization_code',
        code: response.code,
        redirect_uri: constructRedirectUri(),
        client_id: '1a5bd89e7ec24bfa8b7277c907983033',
        code_verifier: sessionStorage.getItem('code_verifier') ?? '',
      }
      const options = { headers: { 'content-type': 'application/x-www-form-urlencoded' } }

      type SpotifyAccessTokenResponse = {
        access_token: string,
        token_type: string,
        scope: string,
        expires_in: number,
        refresh_token: string,
      }
      return this.http.post<SpotifyAccessTokenResponse>(url, new URLSearchParams(body), options).pipe(
        tap(() => sessionStorage.removeItem('code_verifier')),
        tap(response => this.sessionManager.onAuthorizationResponse(response)),
        map(() => ({ success: true })),
      )
    }

    const parseQueryParams = (urlSearchParams: URLSearchParams): SpotifyAuthorizeResponse =>
      urlSearchParams.has('code')
        ? {
          code: urlSearchParams.get('code') ?? '',
        }
        : {
          error: urlSearchParams.get('error') ?? ''
        }
    
    return onAuthorize(parseQueryParams(queryParams))
  }

  public isAuthorized(): boolean {
    return !! sessionStorage.getItem('refresh_token')
  }
}

// TODO: this assumes it was called from the /login route...
const constructRedirectUri = () => `${window.location.origin}${window.location.pathname}`
