import { Injectable } from "@angular/core"
import { Actions, concatLatestFrom, createEffect, ofType } from "@ngrx/effects"
import { Store, createAction, createFeatureSelector, createReducer, createSelector, on, props } from "@ngrx/store"
import { catchError, filter, map, of, switchMap, tap } from "rxjs"
import { SpotifyClient, TrackObject } from "src/app/spotify/spotify-client.service"

export const QueueRecommendationFeature = 'queue-recommendation'

/* ==== STATE ==== */
type State = {
  currentlyPlaying: TrackObject | undefined,
  queue: TrackObject[] | undefined,
  recommendations: TrackObject[] | undefined
}

const initialState: State = {
  currentlyPlaying: undefined,
  queue: undefined,
  recommendations: undefined,
}

/* ==== ACTIONS ==== */
export class QueueRecommendationActions {
  public static readonly getQueue = createAction('[queue] get queue')
  public static readonly getQueueSuccess = createAction('[queue] success: get queue', props<{response: { queue: TrackObject[], currentlyPlaying: TrackObject }}>())
  public static readonly getQueueFailure = createAction('[queue] failure: get queue', props<{error: unknown}>())
  
  public static readonly getRecommendations = createAction('[recommendations] get recommendations')
  public static readonly getRecommendationsSuccess = createAction('[recommendations] success: get recommendations', props<{recommendations: TrackObject[]}>())
  public static readonly getRecommendationsFailure = createAction('[recommendations] failure: get recommendations', props<{error: unknown}>())

  private constructor() {}
}

/* ==== SELECTORS ==== */
const featureSelector = createFeatureSelector<State>(QueueRecommendationFeature)
export class QueueRecommendationSelectors {
  public static readonly currentlyPlaying = createSelector(featureSelector, state => {
    return state.currentlyPlaying
  })

  public static readonly queue = createSelector(featureSelector, state => {
    return state.queue
  })

  public static readonly selectedQueueForRecommendations = createSelector(featureSelector, state => {
    return state.queue
      ?.filter((_, index) => index < 5)
      .map(x => x.id) ?? []
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
)

/* ==== EFFECTS ==== */
@Injectable()
export class QueueRecommendationEffects {
  fetchQueue = createEffect(() => this.actions.pipe(
    ofType(QueueRecommendationActions.getQueue),
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

  reportErrors = createEffect(() => this.actions.pipe(
    ofType(
      QueueRecommendationActions.getRecommendationsFailure,
      QueueRecommendationActions.getQueueFailure,
    ),
    // filter(action => 'error' in action),
    tap(action => console.error(`Error from action '${action.type}':`, action.error))
  ), {dispatch: false})

  constructor(
    private readonly actions: Actions,
    private readonly store: Store,
    private readonly spotify: SpotifyClient,
  ) {}
}