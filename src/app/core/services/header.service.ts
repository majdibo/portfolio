import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  constructor(private router: Router) {
  }

  isHome() {
    return this.router.events
      .pipe(filter(event => event instanceof NavigationEnd),
        map(e => {
            if (this.checkForHome((e as NavigationEnd).url)) {
              return true;
            }
            return false;
          }
        )
      )
      ;
  }

  private checkForHome(url: string): boolean {
    return url.startsWith('/#') || url === '/';
  }
}
