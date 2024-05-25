import { Pipe, PipeTransform } from "@angular/core";
import { TrackObject } from "src/app/spotify/spotify-client.service";


@Pipe({
  name: 'albumArt',
})
export class AlbumArtPipe implements PipeTransform {
  transform(track: TrackObject, targetSize: 'smallest' | 'largest'): string {
    const images = [...(track.album.images)].sort((a, b) => a.width - b.width)

    if (images.length === 0) {
      console.error('Expected track', track, 'to have at least one album art image!')
      return ''
    }

    switch (targetSize) {
      case 'smallest': return images[0].url
      case 'largest': return images[images.length-1].url
    }
  }
}