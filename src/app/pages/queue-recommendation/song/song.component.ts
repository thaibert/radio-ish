import { Component, Input } from '@angular/core';
import { TrackObject } from 'src/app/spotify/spotify-client.service';
import { AlbumArtPipe } from '../album-art.pipe';

@Component({
  selector: 'app-song',
  standalone: true,
  imports: [AlbumArtPipe],
  templateUrl: './song.component.html',
  styleUrl: './song.component.scss'
})
export class SongComponent {
  @Input({required: true}) song!: TrackObject
  @Input() enabled: boolean = true
  @Input() playing: boolean = false
}
