import axios from 'axios';
import { AUTH_BASE_URL } from 'config';
import { refreshAccessToken } from './authservice';

// Add access token to all outgoing calls
axios.interceptors.request.use((request) => {
  if (request.headers.Authorization) {
    return request;
  }

  // If authorization header is not set, add access token
  const accessToken = localStorage.getItem('accessToken');
  request.headers.Authorization = `Bearer ${accessToken}`;

  return request;
});

// Re-authenticate if access token is expired
axios.interceptors.response.use(undefined, async (error) => {
  const originalRequest = error.config;

  if (
    error.response?.status === 401 &&
    !originalRequest.isRetry &&
    originalRequest.url !== `${AUTH_BASE_URL}/renew`
  ) {
    // This is the first 401 we get so we try to refresh the token
    try {
      const { accessToken } = await refreshAccessToken();

      // Set flag in order to not end up in endless loop
      originalRequest.isRetry = true;
      // Update access token so that next request will succeed
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Retry request
      return axios(originalRequest);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // If the error was not a 401 or we already retried, return the error
  return Promise.reject(error);
});
