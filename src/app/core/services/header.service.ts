import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, map, startWith} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  constructor(private router: Router) { }

  private static checkForHomeUrl(url: string): boolean {
    return url.startsWith('/#') || url === '/';
  }

  isHome(): Observable<boolean> {
    return this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => {
        if (event instanceof NavigationEnd) {
          if (HeaderService.checkForHomeUrl(event.url)) {
            return true;
          }
        }

        return false;
      }),
      startWith(HeaderService.checkForHomeUrl(this.router.url))
    );
  }
}
