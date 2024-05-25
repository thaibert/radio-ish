import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { QueueRecommendationPageComponent } from "./queue-recommendation-page/queue-recommendation-page.component";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { QueueRecommendationEffects, QueueRecommendationFeature, queueRecommendationReducer } from "./store";
import { AlbumArtPipe } from "./album-art.pipe";

@NgModule({
    declarations: [
        AlbumArtPipe,
        QueueRecommendationPageComponent,
    ],
    providers: [],
    imports: [
        RouterModule.forChild([{ path: '', component: QueueRecommendationPageComponent }]),
        StoreModule.forFeature(QueueRecommendationFeature, queueRecommendationReducer),
        EffectsModule.forFeature(QueueRecommendationEffects),
        CommonModule,
    ]
})
export class QueueRecommendationModule {}

