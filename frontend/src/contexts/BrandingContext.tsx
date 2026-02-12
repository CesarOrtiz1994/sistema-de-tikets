import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import brandingService, { BrandingConfig } from '../services/branding.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DEFAULT_BRANDING: BrandingConfig = {
  id: '',
  logoUrl: null,
  logoSmallUrl: null,
  appName: 'SCOT',
  primaryColor: '#9333ea',
  secondaryColor: '#2563eb',
  sidebarBgColor: '#ffffff',
  sidebarTextColor: '#4b5563',
  loginBgType: 'gradient',
  loginBgValue: 'from-slate-900 via-purple-900 to-slate-900',
  loginBgImageUrl: null,
  isActive: true,
  updatedAt: '',
};

interface BrandingContextType {
  branding: BrandingConfig;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  getLogoUrl: (url: string | null) => string | null;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  loading: true,
  refreshBranding: async () => {},
  getLogoUrl: () => null,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const data = await brandingService.getActiveBranding();
      setBranding(data);
      applyCSSVariables(data);
    } catch (err) {
      console.warn('[Branding] Failed to load, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLogoUrl = (url: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        refreshBranding: fetchBranding,
        getLogoUrl,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

/**
 * Aplica los colores del branding como CSS custom properties en :root
 * para que se puedan usar en todo el proyecto
 */
function applyCSSVariables(config: BrandingConfig) {
  const root = document.documentElement;

  root.style.setProperty('--brand-primary', config.primaryColor);
  root.style.setProperty('--brand-secondary', config.secondaryColor);

  // Generar versiones con opacidad para hover, bg, etc.
  root.style.setProperty('--brand-primary-light', `${config.primaryColor}20`);
  root.style.setProperty('--brand-secondary-light', `${config.secondaryColor}20`);
  root.style.setProperty('--brand-sidebar-bg', config.sidebarBgColor);
}
