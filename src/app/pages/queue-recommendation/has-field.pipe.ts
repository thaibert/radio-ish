import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'hasField',
  standalone: true,
})
export class HasFieldPipe implements PipeTransform {
  transform<K extends string|number|symbol, V>(object: Record<string, V>, field: K): object is Record<K, V> {
    return field in object
  }
}