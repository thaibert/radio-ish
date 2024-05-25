import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter, map, share, take, takeUntil, tap, timer } from 'rxjs';

type Session = { accessToken: string }

@Injectable({
  providedIn: 'root'
})
export class SpotifySessionManager implements OnDestroy {
  private onDestroy$: Subject<void> = new Subject()

  private session: Subject<Session | undefined> = new BehaviorSubject<Session | undefined>(undefined)

  constructor(
    private readonly http: HttpClient,
  ) {}

  public onAuthorizationResponse(response: { access_token: string, expires_in: number, refresh_token: string }): void {
    this.updateSession(response)
    this.scheduleRefresh(response)
  }

  public getAccessToken(): Observable<string> {
    return this.session.pipe(
      tap(accessToken => { if (accessToken === undefined) {
        this.refresh()
      }}),
      defined(),
      take(1),
      map(session => session.accessToken),
      share(),
    )
  }

  private refresh(): void {
    console.info("refreshing access token @", unixTime())

    const url = 'https://accounts.spotify.com/api/token'
    const body: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: sessionStorage.getItem('refresh_token') ?? '',
      client_id: '1a5bd89e7ec24bfa8b7277c907983033',
    }
    const options = { headers: { 'content-type': 'application/x-www-form-urlencoded' } }

    type SpotifyTokenRefreshResponse = {
      access_token: string,
      token_type: string,
      expires_in: number,
      refresh_token: string,
      scope: string,
    }
    this.http.post<SpotifyTokenRefreshResponse>(url, new URLSearchParams(body), options).pipe(
      tap(response => this.updateSession(response)),
      tap(response => this.scheduleRefresh(response)),
    ).subscribe()
  }

  private updateSession(newSession: {access_token: string, refresh_token: string}): void {
    // Refresh tokens from the PKCE flow are revoked once they are exchanged for an access token.
    // Hence, we persist the new refresh token each time.
    sessionStorage.setItem('refresh_token', newSession.refresh_token)
    
    this.session.next({
      accessToken: newSession.access_token,
    })
  }

  private scheduleRefresh(nextRefresh: {expires_in: number}): void {
    const nextRefreshInSeconds = nextRefresh.expires_in - 60

    console.info('next refresh @', unixTime() + nextRefreshInSeconds)

    timer(nextRefreshInSeconds * 1_000).pipe(
      takeUntil(this.onDestroy$),
      tap(() => this.refresh()),
    ).subscribe()
  }

  ngOnDestroy(): void {
    this.onDestroy$.next()
  }

}

const defined = () => <T>(obs: Observable<T | undefined>): Observable<T> => {
  const isDefined = <T>(x: T | undefined): x is T => x !== undefined
  return obs.pipe(
    filter(isDefined)
  )
}

const unixTime = () => Math.floor(new Date().getTime() / 1_000)