import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export const notificationsService = {
  /**
   * Listar notificaciones del usuario autenticado
   */
  async list(page = 1, limit = 20, unreadOnly = false): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (unreadOnly) params.set('unreadOnly', 'true');

    const response = await api.get(`/api/notifications?${params}`);
    return response.data;
  },

  /**
   * Obtener conteo de no leídas
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/api/notifications/unread-count');
    return response.data.data.unreadCount;
  },

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(id: string): Promise<void> {
    await api.put(`/api/notifications/${id}/read`);
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<void> {
    await api.put('/api/notifications/read-all');
  },

  /**
   * Registrar token FCM
   */
  async registerFcmToken(token: string, device = 'web'): Promise<void> {
    await api.post('/api/notifications/register-token', { token, device });
  },

  /**
   * Eliminar token FCM
   */
  async unregisterFcmToken(token: string): Promise<void> {
    await api.delete('/api/notifications/unregister-token', { data: { token } });
  },
};
