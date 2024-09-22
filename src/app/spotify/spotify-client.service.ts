import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, share, switchMap, combineLatest } from 'rxjs';
import { SpotifySessionManager } from './spotify-session-manager.service';

export type ImageObject = {
  url: string,
  width: number,
  height: number,
}

export type SimplifiedArtistObject = {
  external_urls: unknown,
  href: string,
  id: string,
  name: string,
  type: string,
  uri: string,
}
export type ArtistObject = {
  external_urls: unknown,
  followers: unknown,
  genres: string[],
  href: string,
  id: string,
  images: ImageObject[]
  name: string,
  popularity: number,
  type: string,
  uri: string,
}

export type TrackObject = {
  album: {
    album_type: string,
    total_tracks: number,
    available_markets: string[],
    external_urls: unknown,
    href: string,
    id: string,
    images: ImageObject[],
    name: string,
    release_date: string,
    release_date_precision: 'year' | 'month' | 'day',
    restrictions: unknown,
    type: 'album',
    uri: string,
    artists: SimplifiedArtistObject[],
  },
  artists: ArtistObject[],
  available_markets: string[],
  disc_number: number,
  duration_ms: number,
  explicit: boolean,
  external_ids: unknown,
  external_urls: unknown,
  href: string,
  id: string,
  is_playable: boolean,
  linked_from: unknown,
  restrictions: unknown,
  name: string,
  popularity: number,
  preview_url: string | null,
  track_number: number,
  type: 'track',
  uri: string,
  is_local: boolean,
}

export type RecommendationSeedObject = {
  afterFilteringSize: number,
  afterRelinkingSize: number,
  href: string,
  id: string,
  initialPoolSize: number,
  type: 'artist' | 'track' | 'genre',
}

type Result<Ok> = 
  | { ok: Ok }
  | { error: string }

@Injectable({
  providedIn: 'root'
})
export class SpotifyClient {

  // TODO: session/local storage management. What if not available?

  private readonly SpotifyApiBaseUrl = 'https://api.spotify.com/v1'

  constructor(
    private readonly http: HttpClient,
    private readonly sessionManager: SpotifySessionManager,
  ) {}

  // TODO: Ok(...)|Error(...) types?
  public getQueue(): Observable<Result<{
    currently_playing: TrackObject,
    queue: TrackObject[],
  }>> {
    return this.withAccessToken(accessToken =>
      this.http.get<{
        currently_playing: TrackObject,
        queue: TrackObject[],
      }>(`${this.SpotifyApiBaseUrl}/me/player/queue`, { headers: constructAuthorizationHeader(accessToken) })
      .pipe(
        share(),
        map(response => {
          if (! ('queue' in response)) {
            return { error: 'no queue present!' }
          }
          return { ok: response }
        }),
        catchError(err => of({error: err})),
      )
    )
  }

  public getRecommendations(seedTracks: string[]): Observable<Result<{
    seeds: RecommendationSeedObject[],
    tracks: TrackObject[],
  }>> {
    const buckets = Math.ceil(seedTracks.length / 5) // Spotify allows at most 5 seeds for recommendations

    return combineLatest(
      new Array<number>(buckets).fill(0)
        .map((_, bucket) => seedTracks.filter((_, i) => i % buckets === bucket))
        .map(seeds => this.getRecommendationsSpotify({seed_tracks: seeds.join(',')}))
    ).pipe(
      map(result => result.reduce((acc, curr) => {
        if ("error" in acc || "error" in curr) {
          const errors = []
          if ("error" in acc) errors.push(acc.error)
          if ("error" in curr) errors.push(curr.error)
            console.log("got errors: ", errors)
          return { error: errors.join("; ") }
        }
        return {
          ok: {
            seeds: merge(acc.ok.seeds, curr.ok.seeds),
            tracks: merge(acc.ok.tracks, curr.ok.tracks),
          }
        }
      })),
    )
  }

  private getRecommendationsSpotify(
    request: ({ seed_artists: string } | { seed_genres: string } | { seed_tracks: string }) & Partial<{}>
  ): Observable<Result<{
    seeds: RecommendationSeedObject[],
    tracks: TrackObject[],
  }>> {
    const queryParams = new URLSearchParams(request).toString()
    return this.withAccessToken(accessToken => this.http.get<{
      seeds: RecommendationSeedObject[],
      tracks: TrackObject[],
      }>(`${this.SpotifyApiBaseUrl}/recommendations?${queryParams}`, { headers: constructAuthorizationHeader(accessToken) })
      .pipe(
        share(),
        map(response => {
          if (! ('tracks' in response)) {
            return { error: 'no recommendations given!' }
          }
          return { ok: response }
        }),
      )
    )
  }

// TODO: getQueue / getPreviouslyPlayed

  public addToQueue(trackUri: string): Observable<Result<void>> {
    return this.withAccessToken(accessToken =>
      this.http.post(
        `${this.SpotifyApiBaseUrl}/me/player/queue?uri=${trackUri}`,
        {},
        {
          headers: constructAuthorizationHeader(accessToken),
          observe: 'response',
          responseType: 'text',
        })
    ).pipe(
      share(),
      map(response => response.status === 204 || response.status === 200 // Spotify returns 200, not 204 as documented...
        ? { ok: undefined }
        : { error: `could not add to queue: ${response.body}` }
      ),
    )
  }

  private withAccessToken<T>(generator: (accessToken: string) => Observable<T>): Observable<T> {
    return this.sessionManager.getAccessToken().pipe(
      switchMap(generator),
    )
  }
}

const constructAuthorizationHeader = (accessToken: string) => ({
  'Authorization': `Bearer ${accessToken}`
})

const merge = <T>(xs: T[], ys: T[]): T[] => {
  const zip = (larger: T[], smaller: T[]): T[][] =>
    larger.map((_, i) => smaller[i] !== undefined
      ? [larger[i], smaller[i]]
      : [larger[i]]
  )
  return xs.length >= ys.length
    ? zip(xs, ys).flat()
    : zip(ys, xs).flat()
}