import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
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
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();
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
      toast.error('Error al cargar usuarios', {
        description: error.response?.data?.message || error.message
      });
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
    const confirmed = await confirm({
      title: 'Eliminar Usuario',
      message: '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await usersService.deleteUser(userId);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await usersService.restoreUser(userId);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al restaurar usuario:', error);
      toast.error('Error al restaurar usuario');
    }
  };

  const handleToggleActivation = async (userId: string, isActive: boolean) => {
    try {
      await usersService.toggleUserActivation(userId, !isActive);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado del usuario');
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-red-200 dark:border-red-800 shadow-sm transition-colors">
          <div className="text-center py-12">
            <FiShield className="text-6xl text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Acceso Denegado</h3>
            <p className="text-red-500 dark:text-red-400">Solo los Super Administradores pueden acceder a esta sección</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600 dark:text-gray-300">Administra usuarios y sus roles en el sistema</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FiUsers className="text-3xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactivos</p>
                <p className="text-3xl font-bold text-orange-600">{stats.inactive}</p>
              </div>
              <FiXCircle className="text-3xl text-orange-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eliminados</p>
                <p className="text-3xl font-bold text-red-600">{stats.deleted}</p>
              </div>
              <FiTrash2 className="text-3xl text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <button
              onClick={loadUsers}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-900 dark:text-gray-200"
            >
              <FiRefreshCw />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          data={users}
          columns={[
            {
              key: 'user',
              header: 'Usuario',
              render: (user: User) => (
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
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                    {user.deletedAt && (
                      <div className="text-xs text-red-500">Eliminado</div>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'email',
              header: 'Email',
              render: (user: User) => (
                <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
              )
            },
            {
              key: 'role',
              header: 'Rol',
              render: (user: User) => (
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.roleType as RoleType)}`}>
                  {getRoleLabel(user.roleType as RoleType)}
                </span>
              )
            },
            {
              key: 'status',
              header: 'Estado',
              render: (user: User) => (
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              )
            },
            {
              key: 'created',
              header: 'Fecha Creación',
              render: (user: User) => (
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  {new Date(user.createdAt).toLocaleDateString('es-ES')}
                </div>
              )
            },
            {
              key: 'actions',
              header: 'Acciones',
              align: 'right' as const,
              render: (user: User) => (
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
              )
            }
          ]}
          loading={loading}
          emptyMessage="No se encontraron usuarios con los filtros aplicados"
          emptyIcon={<FiUsers />}
          getRowKey={(user) => user.id}
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

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

      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </RoleGuard>
  );
}
