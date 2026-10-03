/** REST calls for rooms. Live room actions go over WebSockets (see useRoomSocket). */
import apiClient from '../../../shared/lib/apiClient';

export const roomApi = {
  create: (data) => apiClient.post('/rooms', data), // { name, videoUrl? } -> { room }
  getByCode: (code) => apiClient.get(`/rooms/${code}`), // -> { room }
  getMine: () => apiClient.get('/rooms/mine'), // -> { rooms }
};
