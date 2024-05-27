import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { TrackObject } from 'src/app/spotify/spotify-client.service';
import { QueueRecommendationActions } from '../store';

@Component({
  selector: 'app-add-to-queue',
  standalone: true,
  imports: [],
  templateUrl: './add-to-queue.component.html',
  styleUrl: './add-to-queue.component.scss'
})
export class AddToQueueComponent {
  @Input({required: true}) song!: TrackObject

  constructor(
    private readonly store: Store,
  ) {}

  onClick(): void {
    this.store.dispatch(QueueRecommendationActions.addToQueue({trackUri: this.song.uri}))
  }
}
