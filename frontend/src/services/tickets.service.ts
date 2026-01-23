import api from './api';

export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Ticket {
  id: string;
  ticketNumber: string;
  departmentId: string;
  formId: string;
  requesterId: string;
  assignedToId?: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  formData: Record<string, any>;
  slaDeadline?: string;
  slaExceeded: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  department?: {
    id: string;
    name: string;
    prefix: string;
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
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
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
  assignedToId?: string | null;
  formData?: Record<string, any>;
}

export interface ListTicketsParams {
  departmentId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  requesterId?: string;
  search?: string;
  page?: number;
  limit?: number;
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
    if (params.assignedToId) queryParams.append('assignedToId', params.assignedToId);
    if (params.requesterId) queryParams.append('requesterId', params.requesterId);
    if (params.search) queryParams.append('search', params.search);
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

  async assignTicket(id: string, assignedToId: string): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${id}/assign`, { assignedToId });
    return response.data.data;
  }

  async changeStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${id}/status`, { status });
    return response.data.data;
  }

  async changePriority(id: string, priority: TicketPriority): Promise<Ticket> {
    const response = await api.put(`/api/tickets/${id}/priority`, { priority });
    return response.data.data;
  }
}

export const ticketsService = new TicketsService();
