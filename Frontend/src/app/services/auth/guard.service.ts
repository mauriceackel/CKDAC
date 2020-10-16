import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private authService: AuthenticationService, private router: Router) { }

  public async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    await this.authService.getUserAwaitPromise();

    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/home/login'], { queryParams: { returnUrl: state.url } });
    }
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserTypeGuardService implements CanActivate {

  constructor(private authService: AuthenticationService, private router: Router) { }

  public async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    await this.authService.getUserAwaitPromise();

    let user = this.authService.AuthUser;
    if (route.data.allowedTypes != undefined && route.data.allowedTypes.includes(user.type)) {
      return true;
    } else {
      return this.router.createUrlTree(['/error']);
    }
  }
}
