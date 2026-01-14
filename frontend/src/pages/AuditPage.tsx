import RoleGuard from '../components/RoleGuard';
import { RoleType } from '../types/permissions';
import { FiActivity, FiShield } from 'react-icons/fi';

export default function AuditPage() {
  return (
    <RoleGuard 
      roles={[RoleType.SUPER_ADMIN]}
      fallback={
        <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm">
          <div className="text-center py-12">
            <FiShield className="text-6xl text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">Acceso Denegado</h3>
            <p className="text-red-500">Solo los Super Administradores pueden acceder a los logs de auditoría</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
            <p className="text-gray-600 mt-1">Monitorea todas las acciones del sistema</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center py-12">
            <FiActivity className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Logs de Auditoría</h3>
            <p className="text-gray-500">Sistema de auditoría próximamente</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
