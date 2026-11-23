import { useCallback, useEffect } from 'react';
import { usePriorityLabelStore } from '../store/priorityLabelStore';
import type { SLAPriority } from '../services/departmentSLA.service';

export const PRIORITY_ORDER: SLAPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const DEFAULT_PRIORITY_LABELS: Record<SLAPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

/**
 * Devuelve el nombre de la configuración SLA que el departamento asignó a cada prioridad.
 * Si el departamento no tiene configuración para esa prioridad, usa el nombre genérico.
 */
export function usePriorityLabels(departmentIds: Array<string | null | undefined>) {
  const labels = usePriorityLabelStore((state) => state.labels);
  const loadDepartments = usePriorityLabelStore((state) => state.loadDepartments);

  const idsKey = Array.from(new Set(departmentIds.filter(Boolean) as string[]))
    .sort()
    .join(',');

  useEffect(() => {
    if (idsKey) loadDepartments(idsKey.split(','));
  }, [idsKey, loadDepartments]);

  const getLabel = useCallback(
    (departmentId: string | null | undefined, priority: SLAPriority, fallback?: string) =>
      (departmentId && labels[departmentId]?.[priority]) || fallback || DEFAULT_PRIORITY_LABELS[priority],
    [labels]
  );

  const getOptions = useCallback(
    (departmentId: string | null | undefined) =>
      PRIORITY_ORDER.map((value) => ({ value, label: getLabel(departmentId, value) })),
    [getLabel]
  );

  return { getLabel, getOptions };
}
