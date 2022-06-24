import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {PortfolioModule} from './portfolio/portfolio.module';

const appRoutes: Routes = [
  {path: '', loadChildren: () => PortfolioModule}
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {anchorScrolling: 'enabled'})
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
