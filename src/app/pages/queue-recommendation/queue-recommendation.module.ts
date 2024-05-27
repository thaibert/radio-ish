import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { QueueRecommendationPageComponent } from "./queue-recommendation-page/queue-recommendation-page.component";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { QueueRecommendationEffects, QueueRecommendationFeature, queueRecommendationReducer } from "./store";
import { AlbumArtPipe } from "./album-art.pipe";
import { SongComponent } from "./song/song.component";
import { AddToQueueComponent } from "./add-to-queue/add-to-queue.component";

@NgModule({
    declarations: [
        QueueRecommendationPageComponent,
    ],
    providers: [],
    imports: [
        AddToQueueComponent,
        AlbumArtPipe,
        RouterModule.forChild([{ path: '', component: QueueRecommendationPageComponent }]),
        SongComponent,
        StoreModule.forFeature(QueueRecommendationFeature, queueRecommendationReducer),
        EffectsModule.forFeature(QueueRecommendationEffects),
        CommonModule,
    ]
})
export class QueueRecommendationModule {}

