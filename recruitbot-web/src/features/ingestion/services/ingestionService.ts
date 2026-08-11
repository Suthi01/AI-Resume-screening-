import apiClient from '../../../lib/api/client';
import type { AxiosProgressEvent } from 'axios';

export const ingestionService = {
  /**
   * Uploads a resume PDF to the backend ingestion endpoint.
   * @param file The PDF File object to be uploaded.
   * @param onProgress Callback function to track the upload progress.
   */
  async injectResume(file: File, onProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/v1/resume/inject', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    
    return response.data;
  },
};
export default ingestionService;
