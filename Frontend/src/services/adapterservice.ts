import axios from 'axios';
import { BACKEND_BASE_URL } from 'config';
import ApiResponse from 'models/ApiResponse';
import { MappingModel } from 'models/MappingModel';

type AdapterType = 'javascript';

async function generateAdapter(
  mapping: MappingModel,
  type: AdapterType,
): Promise<string> {
  const response = await axios.post<ApiResponse<{ fileId: string }>>(
    `${BACKEND_BASE_URL}/adapters/generate/${type}`,
    {
      mapping,
    },
  );

  return `${BACKEND_BASE_URL}/adapters/download/${response.data.result.fileId}`;
}

export default generateAdapter;
