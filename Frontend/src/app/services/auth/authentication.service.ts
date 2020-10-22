import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { IUser } from '~/app/models/user-model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private jwtHelper: JwtHelperService
  private authUserSubject: BehaviorSubject<IUser>;
  public authUserObserver: Observable<IUser>;
  public loadingUserSubject = new BehaviorSubject<boolean>(false);
  public get AuthUser() {
    return this.authUserSubject.value;
  }

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private userService: UserService
  ) {
    this.jwtHelper = new JwtHelperService();
    this.authUserSubject = new BehaviorSubject<IUser>(undefined);
    this.authUserObserver = this.authUserSubject.asObservable();

    this.tokenService.accessTokenObserver.subscribe(async (val) => {
      this.authUserSubject.next(await this.getAuthenticatedUser());
      this.loadingUserSubject.next(false);
    })
  }

  public async login(email: string, password: string) {
    await this.tokenService.retrieveAccessToken(email, password);
  }

  public async logout() {
    this.tokenService.logout();
    this.router.navigate(['/home/login']);
  }

  public async refreshUser() {
    this.authUserSubject.next(await this.getAuthenticatedUser());
    this.loadingUserSubject.next(false);
  }

  private async getAuthenticatedUser() {
    this.loadingUserSubject.next(true);

    let userId = this.jwtHelper.decodeToken(this.tokenService.AccessToken || undefined)?.userId;
    if (userId != undefined) {
      return await this.userService.getUser(userId);
    }
    return null;
  }

  public isAuthenticated() {
    return this.tokenService.accessTokenValid();
  }

  public getUserAwaitPromise() {
    return new Promise<boolean>((resolve, reject) => {
      if (this.loadingUserSubject.value) {
        this.loadingUserSubject.asObservable().subscribe((val) => {
          if (!val) resolve(true);
        })
      } else {
        resolve(true);
      }
    });
  }
}
