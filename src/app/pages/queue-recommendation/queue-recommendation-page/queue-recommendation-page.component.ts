import { Component } from '@angular/core';
import { CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop'
import { Store } from '@ngrx/store';
import { QueueRecommendationActions, QueueRecommendationSelectors } from '../store';
import { TrackObject } from 'src/app/spotify/spotify-client.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-queue-recommendation-page',
  templateUrl: './queue-recommendation-page.component.html',
  styleUrl: './queue-recommendation-page.component.scss'
})
export class QueueRecommendationPageComponent {
  currentAndFutureSongs = this.store.select(QueueRecommendationSelectors.currentAndFutureSongs)
  intervalInside = this.store.select(QueueRecommendationSelectors.intervalInside)
  recommendations = this.store.select(QueueRecommendationSelectors.recommendations)

  private _currentAndFutureSongs: (TrackObject | {id: string, marker: string})[]

  constructor(
    private readonly store: Store,
  ) {
    this._currentAndFutureSongs = []
    this.store.dispatch(QueueRecommendationActions.getQueue())

    this.currentAndFutureSongs.pipe(
      tap(list => this._currentAndFutureSongs = list),
    ).subscribe()
  }

  refresh() {
    this.store.dispatch(QueueRecommendationActions.getQueue())
  }

  getRecommendations() {
    this.store.dispatch(QueueRecommendationActions.getRecommendations()) 
  }

  drop(event: CdkDragDrop<unknown>): void {
    switch (event.item.data) {
      case 'top': {
        this.store.dispatch(QueueRecommendationActions.moveTopInterval({toIndex: event.currentIndex}))
      } break
      case 'bottom': {
        this.store.dispatch(QueueRecommendationActions.moveBottomInterval({toIndex: event.currentIndex-1}))
      } break
    }
  }

  createSortPredicate(): (index: number, item: CdkDrag<unknown>) => boolean {
    // TODO
    return (index: number, item: CdkDrag<unknown>) => {
      const marker = item.data
      if (! (marker === 'top' || marker === 'bottom')) { return false }
  
      if (marker === 'bottom') {
        return true
      }
  
      const bottomElement = this._currentAndFutureSongs.find(x => x.id === 'bottom')
      const bottomIndex = this._currentAndFutureSongs.indexOf(bottomElement!)
      return index < bottomIndex  
    }
  }

}
