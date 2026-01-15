import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    console.log('Aplicando tema:', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    console.log('Clases del HTML:', root.className);
  }, [theme]);

  return <>{children}</>;
}
