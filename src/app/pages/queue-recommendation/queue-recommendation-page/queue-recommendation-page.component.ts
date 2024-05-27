import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { QueueRecommendationActions, QueueRecommendationSelectors } from '../store';

@Component({
  selector: 'app-queue-recommendation-page',
  templateUrl: './queue-recommendation-page.component.html',
  styleUrl: './queue-recommendation-page.component.scss'
})
export class QueueRecommendationPageComponent {
  currentAndFutureSongs = this.store.select(QueueRecommendationSelectors.currentAndFutureSongs)
  // queue = this.store.select(QueueRecommendationSelectors.queue)
  recommendations = this.store.select(QueueRecommendationSelectors.recommendations)

  constructor(
    private readonly store: Store,
  ) {
    this.store.dispatch(QueueRecommendationActions.getQueue())
  }

  refresh() {
    this.store.dispatch(QueueRecommendationActions.getQueue())
  }

  getRecommendations() {
    this.store.dispatch(QueueRecommendationActions.getRecommendations()) 
  }

}
