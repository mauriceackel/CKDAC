import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUser } from '~/app/models/user-model';
import { ApiResponse } from '~/app/utils/responses/api-response';
import { environment } from '~/environments/environment';

const host = environment.authBaseUrl;
const userRegistrationUrl = `${host}/register`;

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  constructor(private http: HttpClient) { }

  public async registerUser(userData: IUser) {
    try {
      await this.http.post<ApiResponse>(userRegistrationUrl, userData).toPromise();
      return true;
    } catch (err) {
      if (err.status == 409) {
        return false;
      }
      console.log("Error", err);
      throw err;
    }
  }

}
