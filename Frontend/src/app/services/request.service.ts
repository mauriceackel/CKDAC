import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import * as jsonata from 'jsonata';
import { IOpenApiInterface } from '../models/api-interface.model';
import { IOpenApiMapping } from '../models/openapi-mapping.model';
import { stringifyedToJsonata } from '../utils/jsonata-helpers';
import { getRequestUrl } from '../utils/swagger-parser';


@Injectable({
  providedIn: "root"
})
export class RequestService {

  constructor(private httpClient: HttpClient) { }

  public async sendRequest(sourceInputData: any, mapping: IOpenApiMapping, targetInterfaces: { [key: string]: IOpenApiInterface }) {

    const targetInputData = jsonata(stringifyedToJsonata(mapping.requestMapping)).evaluate(sourceInputData);

    const response = {};
    for (const [key, iface] of Object.entries(targetInterfaces)) {
      const { method, url } = await getRequestUrl(iface, targetInputData[key].parameters);

      response[key] = await this.httpClient.request<any>(method, url, { body: targetInputData[key].body, responseType: "json" }).toPromise();
    }

    const sourceOutputData = jsonata(stringifyedToJsonata(mapping.responseMapping)).evaluate(response);

    return sourceOutputData;
  }

}
