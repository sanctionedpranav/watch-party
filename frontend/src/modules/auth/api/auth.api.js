/** REST calls for the auth module (each returns { user, token } or { user }) */
import apiClient from '../../../shared/lib/apiClient';

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
};
