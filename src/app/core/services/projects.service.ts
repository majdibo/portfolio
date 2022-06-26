import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Project} from '../models/project';
import {filter, mergeAll, toArray} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  constructor(private http: HttpClient) {
  }

  getProjects(featured: boolean): Observable<Project[]> {
    let projects$: Observable<Project[]>;
    projects$ = this.http.get<Project[]>('assets/json/projects.json');

    if (featured) {
      return projects$.pipe(
        mergeAll(),
        filter(project => (featured && project.featured) || false),
        toArray()
      );
    }

    return projects$;
  }
}
