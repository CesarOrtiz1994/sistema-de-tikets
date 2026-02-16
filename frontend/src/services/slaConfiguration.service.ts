import api from './api';

export interface SLAConfiguration {
  id: string;
  name: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  response_time: number;
  resolution_time: number;
  escalation_enabled: boolean;
  escalation_time: number | null;
  business_hours_only: boolean;
  notify_on_breach: boolean;
  notify_before: number | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

class SLAConfigurationService {
  async getAllSLAConfigurations(): Promise<SLAConfiguration[]> {
    const response = await api.get('/api/sla-configurations');
    return response.data.data;
  }

  async getDefaultSLAConfiguration(): Promise<SLAConfiguration | null> {
    const response = await api.get('/api/sla-configurations/default');
    return response.data.data;
  }

  async getSLAConfigurationById(id: string): Promise<SLAConfiguration> {
    const response = await api.get(`/api/sla-configurations/${id}`);
    return response.data.data;
  }
}

export default new SLAConfigurationService();
