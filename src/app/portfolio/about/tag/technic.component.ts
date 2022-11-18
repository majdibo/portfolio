import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-technic',
  templateUrl: './technic.component.html',
  styleUrls: ['./technic.component.css']
})
export class TechnicComponent implements OnInit {

  private url = '/blog/tag/';
  @Input() technic: string;

  getTagName(): string{
    return this.technic.replace('@', '');
  }

  getUrl(): string{
    return this.url + this.getTagName();
  }

  isTag(): boolean{
    return this.technic.startsWith('@');
  }

  constructor() {
  }

  ngOnInit(): void {
  }

}
