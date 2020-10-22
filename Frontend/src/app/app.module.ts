import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationService } from './services/auth/authentication.service';
import { DisableChildrenModule } from './utils/directives/disable-children.directive';
import { BaseModule as OpenApiBaseModule } from './views/open-api/base.module';
import { BaseModule as AsyncApiBaseModule } from './views/async-api/base.module';
import { HomeModule } from './views/home/home.module';
import { LoginModule } from './views/login/login.module';
import { AuthGuardService } from './services/auth/guard.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TokenInterceptor } from './services/auth/token.interceptor';
import { RegistrationModule } from './views/registration/registration.module';
import { ProfileModule } from './views/profile/profile.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    RegistrationModule,
    ProfileModule,
    MatIconModule,
    HomeModule,
    OpenApiBaseModule,
    AsyncApiBaseModule,
    LoginModule,
    DisableChildrenModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    JwtHelperService,
    AuthGuardService,
    AuthenticationService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
