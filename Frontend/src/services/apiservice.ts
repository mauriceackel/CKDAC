import { ApiModel, ApiType } from 'models/ApiModel';
import axios from 'axios';
import { BACKEND_BASE_URL } from 'config';
import ApiResponse from 'models/ApiResponse';

export async function getApis(
  type?: ApiType,
  onlyMetaData = true,
  createdBy?: string,
): Promise<Array<ApiModel>> {
  const query = new URLSearchParams({
    onlyMetaData: onlyMetaData.toString(),
  });
  if (type !== undefined) {
    query.append('type', type.toString());
  }
  if (createdBy !== undefined) {
    query.append('createdBy', createdBy);
  }

  const response = await axios.get<ApiResponse<{ apis: ApiModel[] }>>(
    `${BACKEND_BASE_URL}/apis?${query}`,
  );

  return response.data.result.apis || [];
}

export async function getApi<T extends ApiModel>(
  apiId: string,
  onlyMetaData = true,
): Promise<T> {
  const response = await axios.get<ApiResponse<{ api: T }>>(
    `${BACKEND_BASE_URL}/apis/${apiId}?onlyMetaData=${onlyMetaData}`,
  );

  return response.data.result.api;
}

export async function upsertApi(api: Partial<ApiModel>): Promise<void> {
  if (api.id) {
    await axios.put(`${BACKEND_BASE_URL}/apis/${api.id}`, api);

    return;
  }

  await axios.post(`${BACKEND_BASE_URL}/apis`, api);
}

export async function deleteApi(apiId: string): Promise<void> {
  await axios.delete(`${BACKEND_BASE_URL}/apis/${apiId}`);
}
