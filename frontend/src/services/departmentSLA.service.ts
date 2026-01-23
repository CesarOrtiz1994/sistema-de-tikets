import api from './api';

export type SLAPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DepartmentSLA {
  id: string;
  department_id: string;
  sla_configuration_id: string;
  priority: SLAPriority;
  is_default: boolean;
  created_at: string;
  name: string;
  description: string | null;
  response_time: number;
  resolution_time: number;
  escalation_enabled: boolean;
  escalation_time: number | null;
  business_hours_only: boolean;
  notify_on_breach: boolean;
  notify_before: number | null;
  is_active: boolean;
}

export interface AssignSLAData {
  slaConfigurationId: string;
  priority: SLAPriority;
  isDefault?: boolean;
}

class DepartmentSLAService {
  async getDepartmentSLAs(departmentId: string): Promise<DepartmentSLA[]> {
    const response = await api.get(`/api/departments/${departmentId}/sla`);
    return response.data.data;
  }

  async assignSLAToDepartment(
    departmentId: string,
    data: AssignSLAData
  ): Promise<DepartmentSLA> {
    const response = await api.post(`/api/departments/${departmentId}/sla`, data);
    return response.data.data;
  }

  async removeSLAFromDepartment(
    departmentId: string,
    priority: SLAPriority
  ): Promise<void> {
    await api.delete(`/api/departments/${departmentId}/sla/${priority}`);
  }

  async getDefaultSLA(departmentId: string): Promise<DepartmentSLA | null> {
    const response = await api.get(`/api/departments/${departmentId}/sla/default`);
    return response.data.data;
  }
}

export default new DepartmentSLAService();
