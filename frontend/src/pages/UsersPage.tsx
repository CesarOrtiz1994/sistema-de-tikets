import RoleGuard from '../components/RoleGuard';
import { RoleType } from '../types/permissions';
import { FiUsers, FiPlus, FiShield } from 'react-icons/fi';

export default function UsersPage() {
  return (
    <RoleGuard 
      roles={[RoleType.SUPER_ADMIN]}
      fallback={
        <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm">
          <div className="text-center py-12">
            <FiShield className="text-6xl text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">Acceso Denegado</h3>
            <p className="text-red-500">Solo los Super Administradores pueden acceder a esta sección</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administra usuarios y sus roles</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
            <FiPlus />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center py-12">
            <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Panel de Usuarios</h3>
            <p className="text-gray-500">Funcionalidad de gestión de usuarios próximamente</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
