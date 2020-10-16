import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseComponent as OpenApiBaseComponent } from './views/open-api/base.component';
import { ExplanationComponent as OpenApiHomeComponent } from './views/open-api/explanation/explanation.component';
import { DescribeComponent as OpenApiDescribe } from './views/open-api/describe/describe.component';
import { TransformationComponent as OpenApiTransform } from './views/open-api/transformation/transformation.component';
import { BaseComponent as AsyncApiBaseComponent } from './views/async-api/base.component';
import { ExplanationComponent as AsyncApiHomeComponent } from './views/async-api/explanation/explanation.component';
import { DescribeComponent as AsyncApiDescribe } from './views/async-api/describe/describe.component';
import { TransformationComponent as AsyncApiTransform } from './views/async-api/transformation/transformation.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { AuthGuardService } from './services/auth/guard.service';

const routes: Routes = [
  {
    path: 'openapi',
    canActivate: [AuthGuardService],
    component: OpenApiBaseComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full', },
      { path: 'home', component: OpenApiHomeComponent, },
      { path: 'transformation', component: OpenApiTransform, },
      { path: 'describe', component: OpenApiDescribe, }
    ]
  },
  {
    path: 'asyncapi',
    canActivate: [AuthGuardService],
    component: AsyncApiBaseComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full', },
      { path: 'home', component: AsyncApiHomeComponent, },
      { path: 'transformation', component: AsyncApiTransform, },
      { path: 'describe', component: AsyncApiDescribe, }
    ]
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      { path: 'login', component: LoginComponent, },
    ]
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
