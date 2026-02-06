import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TicketAttachment {
  id: string;
  attachmentUrl: string;
  attachmentName: string;
  attachmentType: string;
  attachmentSize: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string | null;
  };
}

export interface AttachmentStats {
  totalCount: number;
  totalSize: number;
  categories: {
    images: number;
    documents: number;
    videos: number;
    audio: number;
    other: number;
  };
}

export const ticketAttachmentsService = {
  async getAttachments(ticketId: string, type?: string): Promise<{ attachments: TicketAttachment[] }> {
    const token = localStorage.getItem('accessToken');
    const params = type ? { type } : {};
    
    const response = await axios.get(`${API_URL}/api/tickets/${ticketId}/attachments`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });
    
    return response.data;
  },

  async getStats(ticketId: string): Promise<AttachmentStats> {
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.get(`${API_URL}/api/tickets/${ticketId}/attachments/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
};
