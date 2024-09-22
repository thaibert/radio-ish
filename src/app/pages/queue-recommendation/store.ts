import { CdkDragDrop } from '@angular/cdk/drag-drop'
import { Injectable } from "@angular/core"
import { Actions, concatLatestFrom, createEffect, ofType } from "@ngrx/effects"
import { Action, ActionCreator, Store, createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store"
import { catchError, delay, map, of, switchMap, tap } from "rxjs"
import { SpotifyClient, TrackObject } from "src/app/spotify/spotify-client.service"

export const QueueRecommendationFeature = 'queue-recommendation'

/* ==== STATE ==== */
type State = {
  currentlyPlaying: TrackObject | undefined,
  queue: TrackObject[] | undefined,
  recommendations: TrackObject[] | undefined,
  // TODO: delimiter<Top|Bottom>
  // TODO: associate with a song id as well to handle songs finishing?
  intervalTop: number,
  intervalBottom: number,
}

const initialState: State = {
  currentlyPlaying: undefined,
  queue: undefined,
  recommendations: undefined,
  intervalTop: 0,
  intervalBottom: 5,
}

/* ==== ACTIONS ==== */
export class QueueRecommendationActions {
  public static readonly getQueue = createAction('[queue] get queue')
  public static readonly getQueueSuccess = createAction('[queue] success: get queue', props<{response: { queue: TrackObject[], currentlyPlaying: TrackObject }}>())
  public static readonly getQueueFailure = createAction('[queue] failure: get queue', props<{error: unknown}>())
  
  public static readonly getRecommendations = createAction('[recommendations] get recommendations')
  public static readonly getRecommendationsSuccess = createAction('[recommendations] success: get recommendations', props<{recommendations: TrackObject[]}>())
  public static readonly getRecommendationsFailure = createAction('[recommendations] failure: get recommendations', props<{error: unknown}>())

  public static readonly addToQueue = createAction('[queue] add to queue', props<{trackUri: string}>())
  public static readonly addToQueueSuccess = createAction('[queue] success: add to queue')
  public static readonly addToQueueFailure = createAction('[queue] failure: add to queue', props<{error: unknown}>())

  public static readonly moveTopInterval = createAction('[interval] move top', props<{toIndex: number}>())
  public static readonly moveBottomInterval = createAction('[interval] move bottom', props<{toIndex: number}>())

  static readonly delay = createAction('[util] delay', props<{delayMs: number, subsequent: Action | ActionCreator}>())
  private constructor() {}
}

/* ==== SELECTORS ==== */
const featureSelector = createFeatureSelector<State>(QueueRecommendationFeature)
export class QueueRecommendationSelectors {

  public static readonly currentlyPlaying = createSelector(featureSelector, state => {
    return {song: state.currentlyPlaying}
  })

  private  static readonly allSongs = createSelector(featureSelector, state => {
    return [
      ...(state.currentlyPlaying ? [state.currentlyPlaying] : []),
      ...state.queue ?? [],
    ]
  })

  public static readonly currentAndFutureSongs = createSelector(featureSelector, this.allSongs, (state, allSongs) => {    
    if (state.intervalBottom < state.intervalTop) {
      console.warn(`Bottom (${state.intervalBottom}) higher up than top (${state.intervalTop})!!`)
    }
    return [
      ...allSongs.slice(0, state.intervalTop),
      { id: 'top', marker: 'top' },
      ...allSongs.slice(state.intervalTop, state.intervalBottom),
      { id: 'bottom', marker: 'bottom' },
      ...allSongs.slice(state.intervalBottom, undefined),
    ]
  })

  public static readonly intervalInside = createSelector(featureSelector, state => {
    return {
      top: state.intervalTop,
      bottom: state.intervalBottom,
    }
  })

  public static readonly selectedQueueForRecommendations = createSelector(featureSelector, this.allSongs, (state, allSongs) => {
    return allSongs
      .map(({id}) => id)
      .slice(state.intervalTop, state.intervalBottom)
  })

  public static readonly recommendations = createSelector(featureSelector, state => {
    return state.recommendations
  })

  private constructor() {}
}

/* ==== REDUCERS ==== */
export const queueRecommendationReducer = createReducer(
  initialState,
  on(QueueRecommendationActions.getQueueSuccess, (state, action) => ({
    ...state,
    queue: action.response.queue,
    currentlyPlaying: action.response.currentlyPlaying,
  })),
  on(QueueRecommendationActions.getRecommendationsSuccess, (state, action) => ({
    ...state,
    recommendations: action.recommendations,
  })),
  on(QueueRecommendationActions.moveTopInterval, (state, action) => ({
    ...state,
    intervalTop: action.toIndex,
  })),
  on(QueueRecommendationActions.moveBottomInterval, (state, action) => ({
    ...state,
    intervalBottom: action.toIndex,
  })),
)

/* ==== EFFECTS ==== */
@Injectable()
export class QueueRecommendationEffects {
  fetchQueue = createEffect(() => this.actions.pipe(
    ofType(QueueRecommendationActions.getQueue, QueueRecommendationActions.addToQueueSuccess),
    switchMap(() => this.spotify.getQueue().pipe(
      map(result => 'ok' in result
        ? QueueRecommendationActions.getQueueSuccess({response: { queue: result.ok.queue, currentlyPlaying: result.ok.currently_playing }})
        : QueueRecommendationActions.getQueueFailure({error: result.error})
      ),
      catchError(err => of(QueueRecommendationActions.getQueueFailure({error: err})))
    ))
  ))

  fetchRecommendations = createEffect(() => this.actions.pipe(
    ofType(QueueRecommendationActions.getRecommendations),
    concatLatestFrom(() => this.store.select(QueueRecommendationSelectors.selectedQueueForRecommendations)),
    switchMap(([, selection]) => this.spotify.getRecommendations(selection).pipe(
      map(result => 'ok' in result
        ? QueueRecommendationActions.getRecommendationsSuccess({recommendations: result.ok.tracks})
        : QueueRecommendationActions.getRecommendationsFailure({error: result.error})
      ),
      catchError(err => of(QueueRecommendationActions.getRecommendationsFailure({error: err})))
    ))
  ))

  addToQueue = createEffect(() => this.actions.pipe(
    ofType(QueueRecommendationActions.addToQueue),
    switchMap(action => this.spotify.addToQueue(action.trackUri).pipe(
      // Delaying is necessary because Spotify provides no guarantee that concurrent
      //   or nearly-concurrent requests for the queue will behave nicely.
      // It turns out to be necessary; sometimes, the returned queue will be `null`
      //   if we don't delay here.
      map(result => 'ok' in result
        ? QueueRecommendationActions.delay({delayMs: 500, subsequent: QueueRecommendationActions.addToQueueSuccess()})
        : QueueRecommendationActions.addToQueueFailure({error: result})
      )
    )),
  ))

  reportErrors = createEffect(() => this.actions.pipe(
    ofType(
      QueueRecommendationActions.getRecommendationsFailure,
      QueueRecommendationActions.getQueueFailure,
      QueueRecommendationActions.addToQueueFailure,
    ),
    tap(action => console.error(`Error from action '${action.type}':`, action.error))
  ), {dispatch: false})

  delay = createEffect(() => this.actions.pipe(
    ofType(QueueRecommendationActions.delay),
    switchMap(({delayMs, subsequent}) => {
      const definitelyAnAction = typeof subsequent === 'function'
        ? subsequent() as Action
        : subsequent
      return of(definitelyAnAction).pipe(
        delay(delayMs),
      )
    })
  ))

  constructor(
    private readonly actions: Actions,
    private readonly store: Store,
    private readonly spotify: SpotifyClient,
  ) {}
}