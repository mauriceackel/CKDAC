import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenResponse } from '~/app/utils/responses/token-response';
import { JwtHelperService } from '@auth0/angular-jwt';
import * as StorageFactory from './storage.factory';
import { ApiResponse } from '~/app/utils/responses/api-response';
import { BehaviorSubject } from 'rxjs';
import { environment } from '~/environments/environment';

const host = environment.authBaseUrl;
const authUrl = `${host}/auth`;
const renewUrl = `${host}/renew`;
const logoutUrl = `${host}/logout`;

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private jwtHelper: JwtHelperService;
  private sessionStorage: Storage;

  constructor(private httpClient: HttpClient) {
    this.jwtHelper = new JwtHelperService();
    this.sessionStorage = StorageFactory.getSessionStorage();

    this.accessTokenSubject.next(this.sessionStorage.getItem("accessToken"));
    this.accessTokenObserver.subscribe((val) => {
      if (val == null) {
        this.sessionStorage.removeItem("accessToken");
      } else {
        setTimeout(() => {
          if (!this.accessTokenValid()) {
            this.renewAccessToken();
          }
        }, Math.abs(Date.now() - this.jwtHelper.getTokenExpirationDate(val).getTime()) / 1000);
        this.sessionStorage.setItem("accessToken", val);
      }
    });

    this.refreshTokenSubject.next(this.sessionStorage.getItem("refreshToken"));
    this.refreshTokenObserver.subscribe((val) => {
      if (val == null) {
        this.sessionStorage.removeItem("refreshToken");
      } else {
        this.sessionStorage.setItem("refreshToken", val);
      }
    })
  }

  private accessTokenSubject = new BehaviorSubject<string>(null);
  public accessTokenObserver = this.accessTokenSubject.asObservable();
  public get AccessToken() {
    return this.accessTokenSubject.value;
  }
  public set AccessToken(value: string | null) {
    this.accessTokenSubject.next(value);
  }

  private refreshTokenSubject = new BehaviorSubject<string>(null);
  public refreshTokenObserver = this.refreshTokenSubject.asObservable();
  public get RefreshToken() {
    return this.refreshTokenSubject.value;
  }
  public set RefreshToken(value: string | null) {
    this.refreshTokenSubject.next(value);
  }

  public async retrieveAccessToken(email: string, password: string) {
    let response = await this.httpClient.post<TokenResponse>(authUrl, {
      email: email,
      password: password
    }).toPromise();
    this.AccessToken = response.result.accessToken;
    this.RefreshToken = response.result.refreshToken;
  }

  public forgetTokens() {
    this.AccessToken = null;
    this.RefreshToken = null;
  }

  public async logout() {
    try {
      let response = await this.httpClient.get<ApiResponse>(logoutUrl).toPromise();
    } catch (err) {
      throw err;
    }
    this.forgetTokens();
  }

  public async renewAccessToken() {
    try {
      if (this.RefreshToken && this.AccessToken) {
        let response = await this.httpClient.get<TokenResponse>(renewUrl, {
          headers: {
            Authorization: `Bearer ${this.RefreshToken}`
          }
        }).toPromise();
        this.AccessToken = response.result.accessToken;
        this.RefreshToken = response.result.refreshToken;
      }
    } catch (err) {
      this.forgetTokens();
      throw err;
    }
  }

  public accessTokenValid() {
    let accessToken = this.AccessToken;
    //Invalidate token 30 seconds earlier
    return accessToken != null && !this.jwtHelper.isTokenExpired(accessToken, -30)
  }
}
