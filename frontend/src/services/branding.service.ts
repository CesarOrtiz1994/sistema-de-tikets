import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface BrandingConfig {
  id: string;
  logoUrl: string | null;
  logoSmallUrl: string | null;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  sidebarBgColor: string;
  sidebarTextColor: string;
  loginBgType: 'gradient' | 'image' | 'color';
  loginBgValue: string;
  loginBgImageUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}

class BrandingService {
  async getActiveBranding(bustCache = false): Promise<BrandingConfig> {
    // Usar fetch directo (no api de axios) porque este endpoint es público
    // y se llama antes de que el usuario tenga token
    // Agregar timestamp para evitar caché cuando bustCache=true
    const url = bustCache 
      ? `${API_BASE_URL}/api/branding?_t=${Date.now()}`
      : `${API_BASE_URL}/api/branding`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener branding');
    return res.json();
  }

  async updateBranding(data: Partial<BrandingConfig>): Promise<BrandingConfig> {
    const res = await api.put('/api/branding', data);
    return res.data;
  }

  async uploadLogo(formData: FormData): Promise<Record<string, string>> {
    const res = await api.post('/api/branding/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
}

export default new BrandingService();
