import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, from } from 'rxjs';
import { map, catchError, switchMap, first } from 'rxjs/operators';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { environment } from '~/environments/environment';

const host = environment.authBaseUrl;
const authUrl = `${host}/auth`;
const renewUrl = `${host}/renew`;

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptor implements HttpInterceptor {
  // Refresh Token Subject tracks the current token, or is null if no token is currently
  // available (e.g. refresh pending).
  private refreshTokenInProgress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private router: Router, private tokenService: TokenService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //Add access token to the request
    let authenticatedRequest = this.addAuthenticationToken(request);

    //Perform request and validate result
    return next.handle(authenticatedRequest).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          console.log('request--->>>', authenticatedRequest);
          console.log('response--->>>', event);
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        //Only 401 errors need to be checked here
        let errorHeader = error.headers.get("WWW-Authenticate");
        //If it's not a 401 or if the reason is not an invalid token
        if (error.status != 401 || error.status == 401 && !(errorHeader && errorHeader.includes("invalid_token"))) {
          return throwError(error);
        }

        //Special handling if error occurs on auth or renew
        if (request.url == authUrl || request.url == renewUrl) {
          //We tried to renew but the refresh token was not valid -> log user out
          if (request.url.includes(renewUrl)) {
            this.router.navigate(['/home/login']);
          }

          //We don't have to request a token renewal here, so pass the error
          return throwError(error);
        }

        //Prevent multiple simultaneous renewal requests
        if (this.refreshTokenInProgress.getValue()) {
          //Wait until the access token is refreshed, then redo the request
          return this.refreshTokenInProgress.pipe(switchMap(() => next.handle(this.addAuthenticationToken(request))));
        } else {
          //Indicate a refresh process
          this.refreshTokenInProgress.next(true);

          //Get new access token
          return from(this.tokenService.renewAccessToken()).pipe(
            switchMap(() => {
              this.refreshTokenInProgress.next(false);
              return next.handle(this.addAuthenticationToken(request));
            }),
            catchError((error: HttpErrorResponse) => {
              this.refreshTokenInProgress.next(false);

              //Dont know if this logout is even neccessarry has to be tested
              //this.auth.logout();
              return throwError(error);
            })
          );
        }
      })
    );
  }

  addAuthenticationToken(request: HttpRequest<any>) {
    // Get access token from Local Storage
    const accessToken = this.tokenService.AccessToken;

    // If access token is null the user is not logged in so we return the original request
    // If the authorization header is already set, we leave it untouched
    if (request.headers.get("Authorization") || !accessToken) {
      return request;
    }

    // Clone the request, as the original request is immutable
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }
}
