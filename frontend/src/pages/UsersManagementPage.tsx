import { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiShield
} from 'react-icons/fi';
import RoleGuard from '../components/RoleGuard';
import UserModal from '../components/UserModal';
import { RoleType } from '../types/permissions';
import usersService, { User, CreateUserData, UpdateUserData } from '../services/users.service';
import { getRoleLabel, getRoleBadgeColor } from '../utils/permissions';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    deleted: 0
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      console.log('Cargando usuarios...');
      setLoading(true);
      const response = await usersService.listUsers({
        search: search,
        roleType: roleFilter !== '' ? roleFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        includeDeleted: statusFilter === 'deleted',
        page: page,
        limit: 10
      });
      
      console.log('Usuarios cargados:', response);
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      alert('Error al cargar usuarios: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await usersService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    
    try {
      await usersService.deleteUser(userId);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await usersService.restoreUser(userId);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al restaurar usuario:', error);
      alert('Error al restaurar usuario');
    }
  };

  const handleToggleActivation = async (userId: string, isActive: boolean) => {
    try {
      await usersService.toggleUserActivation(userId, !isActive);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado del usuario');
    }
  };

  const handleSaveUser = async (data: CreateUserData | UpdateUserData) => {
    try {
      console.log('handleSaveUser - selectedUser:', selectedUser);
      console.log('handleSaveUser - data a enviar:', data);
      
      if (selectedUser) {
        console.log('Actualizando usuario:', selectedUser.id);
        const result = await usersService.updateUser(selectedUser.id, data as UpdateUserData);
        console.log('Usuario actualizado:', result);
      } else {
        console.log('Creando nuevo usuario');
        await usersService.createUser(data as CreateUserData);
      }
      
      console.log('Cerrando modal y recargando lista...');
      setShowModal(false);
      
      console.log('Recargando usuarios...');
      await loadUsers();
      console.log('Recargando estadísticas...');
      await loadStats();
      console.log('Recarga completada');
    } catch (error) {
      console.error('Error en handleSaveUser:', error);
      throw error;
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administra usuarios y sus roles en el sistema</p>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <FiPlus />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiUsers className="text-3xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inactive}</p>
              </div>
              <FiXCircle className="text-3xl text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eliminados</p>
                <p className="text-2xl font-bold text-red-600">{stats.deleted}</p>
              </div>
              <FiTrash2 className="text-3xl text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="DEPT_ADMIN">Admin Departamento</option>
              <option value="SUBORDINATE">Subordinado</option>
              <option value="REQUESTER">Solicitante</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <button
              onClick={loadUsers}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiRefreshCw />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay usuarios</h3>
              <p className="text-gray-500">No se encontraron usuarios con los filtros aplicados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt={user.name} 
                                className="w-10 h-10 rounded-full mr-3"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent && !parent.querySelector('.fallback-avatar')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'fallback-avatar w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3';
                                    const span = document.createElement('span');
                                    span.className = 'text-purple-600 font-semibold';
                                    span.textContent = user.name.charAt(0);
                                    fallback.appendChild(span);
                                    parent.insertBefore(fallback, e.currentTarget);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                <span className="text-purple-600 font-semibold">{user.name.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              {user.deletedAt && (
                                <div className="text-xs text-red-500">Eliminado</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.roleType as RoleType)}`}>
                            {getRoleLabel(user.roleType as RoleType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {user.deletedAt ? (
                              <button
                                onClick={() => handleRestore(user.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Restaurar"
                              >
                                <FiRefreshCw />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleActivation(user.id, user.isActive)}
                                  className={user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                                  title={user.isActive ? 'Desactivar' : 'Activar'}
                                >
                                  {user.isActive ? <FiXCircle /> : <FiCheckCircle />}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar"
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Eliminar"
                                >
                                  <FiTrash2 />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </RoleGuard>
  );
}
