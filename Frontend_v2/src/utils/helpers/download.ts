import axios from 'axios';
import { saveAs } from 'file-saver';

async function downloadFile(downloadUrl: string, name: string): Promise<void> {
  const response = await axios.get(downloadUrl, { responseType: 'blob' });
  saveAs(response.data, name);
}

export default downloadFile;
