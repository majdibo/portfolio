import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Bio} from '../models/bio';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BioService {

  constructor(private http: HttpClient) { }

  getBio(): Observable<Bio> {
    return this.http.get<Bio>('assets/json/bio.json');
  }
}
