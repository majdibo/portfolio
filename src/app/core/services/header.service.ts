import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  constructor(private router: Router) {
  }

  private static checkForHome(url: string): boolean {
    return url.startsWith('/#') || url === '/';
  }

  isHome(): Observable<boolean> {
    return this.router.events.pipe(filter(event => event instanceof NavigationEnd),
        map(e => HeaderService.checkForHome((e as NavigationEnd).url)
        )
      );
  }
}
