import api from './api';

export interface UnreadCounts {
  [ticketId: string]: number;
}

export const unreadMessagesService = {
  /**
   * Obtener el conteo de mensajes no leídos para un ticket específico
   */
  async getUnreadCount(ticketId: string): Promise<number> {
    try {
      const response = await api.get(`/api/unread-messages/${ticketId}/count`);
      return response.data.count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  /**
   * Obtener el conteo de mensajes no leídos para todos los tickets del usuario
   */
  async getUnreadCounts(): Promise<UnreadCounts> {
    try {
      const response = await api.get('/api/unread-messages/counts');
      return response.data.counts;
    } catch (error) {
      console.error('Error getting unread counts:', error);
      throw error;
    }
  },

  /**
   * Marcar un ticket como leído
   */
  async markAsRead(ticketId: string): Promise<void> {
    try {
      await api.post(`/api/unread-messages/${ticketId}/mark-read`);
    } catch (error: any) {
      // Si es 404, significa que no hay mensajes no leídos (chat nuevo)
      // Esto es normal y no debe considerarse un error
      if (error?.response?.status === 404) {
        return;
      }
      console.error('Error marking ticket as read:', error);
      throw error;
    }
  }
};
