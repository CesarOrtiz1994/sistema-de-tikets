import { useEffect } from 'react';

/**
 * Hook para actualizar el título de la pestaña del navegador
 * @param title - Título de la página (sin el prefijo "SCOT")
 * @example usePageTitle('Mis Tickets') -> "SCOT | Mis Tickets"
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `SCOT | ${title}` : 'SCOT';

    // Limpiar al desmontar
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
