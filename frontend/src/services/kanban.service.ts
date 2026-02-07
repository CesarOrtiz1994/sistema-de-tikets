import api from './api';

export interface KanbanTicket {
  id: string;
  ticketNumber: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  timeInStatus: number;
  slaDeadline?: string;
  slaExceeded: boolean;
  slaPausedAt?: string;
  requester: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  } | null;
  department: {
    id: string;
    name: string;
    prefix: string;
    requireDeliverable?: boolean;
  };
}

export interface KanbanColumn {
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED';
  label: string;
  tickets: KanbanTicket[];
  count: number;
}

export interface KanbanFilters {
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedToId?: string;
  onlyMine?: boolean;
}

class KanbanService {
  /**
   * Obtiene el tablero Kanban de un departamento
   */
  async getDepartmentKanban(
    departmentId: string,
    filters?: KanbanFilters
  ): Promise<KanbanColumn[]> {
    const params = new URLSearchParams();
    
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    
    if (filters?.assignedToId) {
      params.append('assignedToId', filters.assignedToId);
    }
    
    if (filters?.onlyMine) {
      params.append('onlyMine', 'true');
    }

    const queryString = params.toString();
    const url = `/api/departments/${departmentId}/kanban${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data;
  }

  /**
   * Obtiene el tablero Kanban de todos los departamentos del usuario
   */
  async getAllDepartmentsKanban(
    filters?: KanbanFilters
  ): Promise<KanbanColumn[]> {
    const params = new URLSearchParams();
    
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    if (filters?.assignedToId) {
      params.append('assignedToId', filters.assignedToId);
    }
    if (filters?.onlyMine) {
      params.append('onlyMine', 'true');
    }

    const queryString = params.toString();
    const url = `/api/kanban/all${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data;
  }

  /**
   * Asignación rápida de ticket desde el Kanban
   */
  async quickAssignTicket(
    ticketId: string,
    assignedToId: string | null
  ): Promise<void> {
    await api.put(`/api/tickets/${ticketId}/quick-assign`, {
      assignedToId
    });
  }
}

export default new KanbanService();
