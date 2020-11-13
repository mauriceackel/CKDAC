import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { ApiType, IApi } from '../models/api.model';
import { environment } from '~/environments/environment';
import { ApiDataResponse } from '../utils/responses/api-data-response';
import { ApiResponse } from '../utils/responses/api-response';

const host = environment.backendBaseUrl;

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private httpClient: HttpClient
  ) { }

  public async getApis(type?: ApiType): Promise<Array<IApi>> {
    const response = await this.httpClient.get<ApiDataResponse>(`${host}/apis${type ? `?type=${type}` : ''}`).toPromise();

    return response.result.apis || [];
  }

  public async getApi(apiId: string): Promise<IApi> {
    const response = await this.httpClient.get<ApiDataResponse>(`${host}/apis/${apiId}`).toPromise();

    return response.result.api;
  }

  public async upsertApi(api: Partial<IApi>) {
    if (api.id) {
      const response = await this.httpClient.put<ApiResponse>(`${host}/apis/${api.id}`, api).toPromise();
      return;
    }

    const response = await this.httpClient.post<ApiDataResponse>(`${host}/apis`, api).toPromise();
    return;
  }

  public async deleteApi(apiId: string) {
    const response = await this.httpClient.delete<ApiResponse>(`${host}/apis/${apiId}`).toPromise();
    return;
  }

}
