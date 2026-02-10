import api from './api';

export interface DashboardMetrics {
  totalTickets: number;
  pending: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  cancelled: number;
  slaExceeded: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  totalUsers: number;
  totalDepartments: number;
  recentTickets: RecentTicket[];
}

export interface RecentTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  department: { name: string };
  requester: { name: string };
  assignedTo: { name: string } | null;
}

export interface TicketsByStatus {
  status: string;
  count: number;
}

export interface TicketsByDepartment {
  departmentId: string;
  departmentName: string;
  count: number;
}

export interface AvgResolutionTime {
  avgHours: number;
  count: number;
}

export interface Satisfaction {
  avgRating: number;
  count: number;
  distribution: Record<number, number>;
}

export interface SlaCompliance {
  total: number;
  onTime: number;
  exceeded: number;
  complianceRate: number;
}

export interface TicketTrend {
  date: string;
  created: number;
  resolved: number;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface MetricsFilters {
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

function buildParams(filters: MetricsFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.period) params.period = filters.period;
  return params;
}

class MetricsService {
  async getDashboard(filters: MetricsFilters = {}): Promise<DashboardMetrics> {
    const response = await api.get('/api/metrics/dashboard', { params: buildParams(filters) });
    return response.data.data;
  }

  async getTicketsByStatus(filters: MetricsFilters = {}): Promise<TicketsByStatus[]> {
    const response = await api.get('/api/metrics/tickets-by-status', { params: buildParams(filters) });
    return response.data.data;
  }

  async getTicketsByDepartment(filters: MetricsFilters = {}): Promise<TicketsByDepartment[]> {
    const response = await api.get('/api/metrics/tickets-by-department', { params: buildParams(filters) });
    return response.data.data;
  }

  async getAvgResolutionTime(filters: MetricsFilters = {}): Promise<AvgResolutionTime> {
    const response = await api.get('/api/metrics/avg-resolution-time', { params: buildParams(filters) });
    return response.data.data;
  }

  async getSatisfaction(filters: MetricsFilters = {}): Promise<Satisfaction> {
    const response = await api.get('/api/metrics/satisfaction', { params: buildParams(filters) });
    return response.data.data;
  }

  async getSlaCompliance(filters: MetricsFilters = {}): Promise<SlaCompliance> {
    const response = await api.get('/api/metrics/sla-compliance', { params: buildParams(filters) });
    return response.data.data;
  }

  async getTicketsTrend(filters: MetricsFilters = {}): Promise<TicketTrend[]> {
    const response = await api.get('/api/metrics/tickets-trend', { params: buildParams(filters) });
    return response.data.data;
  }

  async getUserDepartments(): Promise<DepartmentOption[]> {
    const response = await api.get('/api/metrics/departments');
    return response.data.data;
  }
}

export const metricsService = new MetricsService();
