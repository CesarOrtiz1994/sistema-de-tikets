import { create } from 'zustand';
import departmentSLAService, { type SLAPriority } from '../services/departmentSLA.service';

type DepartmentPriorityLabels = Partial<Record<SLAPriority, string>>;

interface PriorityLabelState {
  labels: Record<string, DepartmentPriorityLabels>;
  loadDepartments: (departmentIds: string[]) => Promise<void>;
  invalidate: (departmentId: string) => void;
}

const requested = new Set<string>();

// Nombre del SLA configurado por cada departamento para cada prioridad
export const usePriorityLabelStore = create<PriorityLabelState>((set) => ({
  labels: {},

  loadDepartments: async (departmentIds) => {
    const pending = departmentIds.filter((id) => !requested.has(id));
    pending.forEach((id) => requested.add(id));

    await Promise.all(
      pending.map(async (departmentId) => {
        let departmentLabels: DepartmentPriorityLabels = {};
        try {
          const slas = await departmentSLAService.getDepartmentSLAs(departmentId);
          slas.forEach((sla) => {
            if (sla.name) departmentLabels[sla.priority] = sla.name;
          });
        } catch {
          departmentLabels = {};
        }
        set((state) => ({ labels: { ...state.labels, [departmentId]: departmentLabels } }));
      })
    );
  },

  invalidate: (departmentId) => {
    requested.delete(departmentId);
    set((state) => {
      const labels = { ...state.labels };
      delete labels[departmentId];
      return { labels };
    });
  },
}));
