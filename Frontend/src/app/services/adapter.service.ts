import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from '~/environments/environment';
import { IMapping } from '../models/mapping.model';

const host = environment.backendBaseUrl;
const adapterServiceUrl = `${host}/adapters`;
const downloadUrl = `${adapterServiceUrl}/download`;
const creationUrl = `${adapterServiceUrl}/generate`;

export enum AdapterType {
  JAVASCRIPT = "javascript"
}

@Injectable({
  providedIn: "root"
})
export class AdapterService {

  constructor(
    private httpClient: HttpClient
  ) { }

  public async createAdapter(mapping: IMapping, type: AdapterType) {
    const response = await this.httpClient.post<{ result: { fileId: string } }>(`${creationUrl}/${type}`, { mapping }).toPromise();
    return `${downloadUrl}/${response.result.fileId}`;
  }

}
