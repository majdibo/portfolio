import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortname'
})
export class ShortnamePipe implements PipeTransform {
  transform(value: string, ...args: string[]): string {
    return value.split(' ').map(s => s.charAt(0).toUpperCase()).join('');
  }

}
