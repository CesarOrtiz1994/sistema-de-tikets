import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import SearchInput from '../components/common/SearchInput';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiShield
} from 'react-icons/fi';
import RoleGuard from '../components/RoleGuard';
import UserModal from '../components/Users/UserModal';
import { RoleType } from '../types/permissions';
import usersService, { User, CreateUserData, UpdateUserData } from '../services/users.service';
import { getRoleLabel } from '../utils/permissions';
import { usePageTitle } from '../hooks/usePageTitle';

export default function UsersManagementPage() {
  usePageTitle('Usuarios');
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
      setLoading(true);
      const response = await usersService.listUsers({
        search: search,
        roleType: roleFilter !== '' ? roleFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        includeDeleted: statusFilter === 'deleted',
        page: page,
        limit: 10
      });
      
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
      toast.success('Usuario eliminado exitosamente');
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
      toast.success('Usuario restaurado exitosamente');
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
      toast.success(isActive ? 'Usuario desactivado exitosamente' : 'Usuario activado exitosamente');
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const handleSaveUser = async (data: CreateUserData | UpdateUserData) => {
    try {
      
      if (selectedUser) {
        const result = await usersService.updateUser(selectedUser.id, data as UpdateUserData);
        console.log('Usuario actualizado:', result);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usersService.createUser(data as CreateUserData);
        toast.success('Usuario creado exitosamente');
      }
      
      setShowModal(false);
      
      await loadUsers();
      await loadStats();
    } catch (error) {
      console.error('Error en handleSaveUser:', error);
      throw error;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <RoleGuard 
      roles={[RoleType.SUPER_ADMIN]}
      fallback={
        <Card padding="lg">
          <div className="text-center py-12">
            <FiShield className="text-6xl text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Acceso Denegado</h3>
            <p className="text-red-500 dark:text-red-400">Solo los Super Administradores pueden acceder a esta sección</p>
          </div>
        </Card>
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Usuarios"
          description="Administra usuarios y sus roles en el sistema"
          action={
            <button 
              onClick={() => {
                setSelectedUser(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-gradient bg-brand-gradient-hover text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <FiPlus />
              Nuevo Usuario
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Total Usuarios"
            value={stats.total}
            icon={FiUsers}
            iconColor="text-blue-500"
          />
          <StatCard
            label="Activos"
            value={stats.active}
            icon={FiCheckCircle}
            iconColor="text-green-500"
            valueColor="text-green-600"
          />
          <StatCard
            label="Inactivos"
            value={stats.inactive}
            icon={FiXCircle}
            iconColor="text-orange-500"
            valueColor="text-orange-600"
          />
          <StatCard
            label="Eliminados"
            value={stats.deleted}
            icon={FiTrash2}
            iconColor="text-red-500"
            valueColor="text-red-600"
          />
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar usuarios..."
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
        </Card>

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
              render: (user: User) => {
                const roleVariant = 
                  user.roleType === 'SUPER_ADMIN' ? 'purple' :
                  user.roleType === 'DEPT_ADMIN' ? 'blue' :
                  user.roleType === 'SUBORDINATE' ? 'gray' : 'green';
                return (
                  <Badge variant={roleVariant as any}>
                    {getRoleLabel(user.roleType as RoleType)}
                  </Badge>
                );
              }
            },
            {
              key: 'status',
              header: 'Estado',
              render: (user: User) => (
                <Badge variant={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
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
