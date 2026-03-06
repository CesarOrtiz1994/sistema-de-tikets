import api from './api';

export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Ticket {
  id: string;
  ticketNumber: string;
  departmentId: string;
  formId: string;
  requesterId: string;
  parentTicketId?: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  formData: Record<string, any>;
  slaDeadline?: string;
  slaExceeded: boolean;
  slaPausedAt?: string;
  slaTotalPausedMinutes: number;
  slaStartTime?: string;
  createdOutsideBusinessHours?: boolean;
  waitingReason?: string | null;
  deliverableRejections: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  department?: {
    id: string;
    name: string;
    prefix: string;
    requireRating?: boolean;
    requireDeliverable?: boolean;
    maxDeliverableRejections?: number;
  };
  form?: {
    id: string;
    name: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  assignments?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      profilePicture?: string;
    };
  }>;
  parentTicket?: {
    id: string;
    ticketNumber: string;
    title: string;
  };
  childTickets?: Array<{
    id: string;
    ticketNumber: string;
    title: string;
  }>;
  history?: any[];
}

export interface CreateTicketData {
  departmentId: string;
  formId: string;
  title: string;
  priority: TicketPriority;
  formData: Record<string, any>;
}

export interface UpdateTicketData {
  title?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedUserIds?: string[];
  formData?: Record<string, any>;
}

export interface ListTicketsParams {
  departmentId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  requesterId?: string;
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class TicketsService {
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const response = await api.post('/api/tickets', data);
    return response.data.data;
  }

  async getTicketById(id: string): Promise<Ticket> {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data.data;
  }

  async listTickets(params: ListTicketsParams = {}): Promise<TicketsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.requesterId) queryParams.append('requesterId', params.requesterId);
    if (params.search) queryParams.append('search', params.search);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const response = await api.get(`/api/tickets?${queryParams.toString()}`);
    
    // Backend devuelve: { success, data: [...], pagination: { total, page, limit, totalPages } }
    return {
      data: response.data.data,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      totalPages: response.data.pagination.totalPages
    };
  }

  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${id}`, data);
    return response.data.data;
  }

  async assignTicket(id: string, assignedUserIds: string[]): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${id}/assign`, { assignedUserIds });
    return response.data.data;
  }

  async changeStatus(ticketId: string, status: TicketStatus, waitingReason?: string) {
    const body: any = { status };
    if (waitingReason) body.waitingReason = waitingReason;
    const response = await api.put(`/api/tickets/${ticketId}/status`, body);
    return response.data;
  }

  async resolveTicket(ticketId: string) {
    const response = await api.put(`/api/tickets/${ticketId}/resolve`);
    return response.data;
  }

  async rateTicket(ticketId: string, rating: number, comment?: string) {
    const response = await api.post(`/api/tickets/${ticketId}/rate`, { rating, comment });
    return response.data;
  }

  async closeTicket(ticketId: string, rating?: number, comment?: string) {
    const response = await api.put(`/api/tickets/${ticketId}/close`, { rating, comment });
    return response.data;
  }

  async reopenTicket(ticketId: string, reason: string) {
    const response = await api.post(`/api/tickets/${ticketId}/reopen`, { reason });
    return response.data;
  }

  async changePriority(id: string, priority: TicketPriority): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${id}/priority`, { priority });
    return response.data.data;
  }
}

export const ticketsService = new TicketsService();
