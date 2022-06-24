import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ShortnamePipe} from './shortname.pipe';


@NgModule({
  declarations: [ShortnamePipe],
  imports: [
    CommonModule
  ],
  exports: [ShortnamePipe]
})
export class SharedModule {
}
