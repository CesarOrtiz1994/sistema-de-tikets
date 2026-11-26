import api from './api';
import { Deliverable, DeliverableRejectResult } from '../types/deliverable';

export const deliverablesService = {
  /**
   * Subir un entregable (uno o varios archivos) para un ticket
   */
  async uploadDeliverable(ticketId: string, files: File[]): Promise<Deliverable> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await api.post(
      `/api/tickets/${ticketId}/deliverables`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },

  /**
   * Obtener entregables de un ticket
   */
  async getTicketDeliverables(ticketId: string): Promise<Deliverable[]> {
    const response = await api.get(
      `/api/tickets/${ticketId}/deliverables`
    );

    return response.data.data;
  },

  /**
   * Aprobar un entregable
   */
  async approveDeliverable(deliverableId: string): Promise<Deliverable> {
    const response = await api.post(
      `/api/tickets/deliverables/${deliverableId}/approve`
    );

    return response.data.data;
  },

  /**
   * Rechazar un entregable
   */
  async rejectDeliverable(
    deliverableId: string,
    rejectionReason: string
  ): Promise<DeliverableRejectResult> {
    const response = await api.post(
      `/api/tickets/deliverables/${deliverableId}/reject`,
      { rejectionReason }
    );

    return response.data.data;
  },
};
