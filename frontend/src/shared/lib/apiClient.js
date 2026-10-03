/**
 * apiClient - one configured axios instance for all REST calls.
 *  - baseURL points at the backend (Render in production)
 *  - request interceptor attaches the JWT automatically
 *  - response interceptor turns errors into a readable message
 */
import axios from 'axios';
import { API_URL, TOKEN_KEY } from '../constants/config';

const apiClient = axios.create({ baseURL: `${API_URL}/api` });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data, // callers get the JSON body directly
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.request ? 'Cannot reach the server. It may be waking up - try again in a few seconds.' : error.message);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
