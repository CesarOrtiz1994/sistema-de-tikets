import axios from 'axios';
import type { MessageReceived } from '../validators/socket.validator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface GetMessagesResponse {
  messages: MessageReceived[];
  total: number;
  limit: number;
  offset: number;
}

export const ticketMessagesService = {
  async getMessages(ticketId: string, limit: number = 50, offset: number = 0): Promise<GetMessagesResponse> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_URL}/api/tickets/${ticketId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: { limit, offset }
    });
    return response.data;
  },

  async sendMessage(ticketId: string, message: string): Promise<MessageReceived> {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(
      `${API_URL}/api/tickets/${ticketId}/messages`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  }
};
