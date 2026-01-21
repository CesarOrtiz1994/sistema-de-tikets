import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import { FiUserPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { departmentsService } from '../../services/departments.service';
import { usersService } from '../../services/users.service';
import AssignTicketAccessModal from './AssignTicketAccessModal';

interface DepartmentTicketAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
  isDefaultForRequesters: boolean;
  onToggleDefault: () => void;
}

interface UserWithAccess {
  id: string;
  name: string;
  email: string;
  roleType: string;
  profilePicture?: string;
  departmentRole: string;
  assignedAt: string;
}

export default function DepartmentTicketAccessModal({ 
  isOpen, 
  onClose, 
  departmentId, 
  departmentName,
  isDefaultForRequesters,
  onToggleDefault
}: DepartmentTicketAccessModalProps) {
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDefault, setIsDefault] = useState(isDefaultForRequesters);
  const { isOpen: confirmIsOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();

  useEffect(() => {
    if (isOpen) {
      loadUsersWithAccess();
      loadAvailableUsers();
    }
  }, [isOpen, departmentId]);

  // Actualizar estado local cuando cambia desde el padre
  useEffect(() => {
    setIsDefault(isDefaultForRequesters);
  }, [isDefaultForRequesters]);

  const loadUsersWithAccess = async () => {
    try {
      setLoading(true);
      const response = await departmentsService.getUsersWithAccessToDepartment(departmentId);
      
      if (response.isDefault) {
        setUsers([]);
      } else {
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios con acceso:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersService.listUsers({ page: 1, limit: 100 });
      const assignedUserIds = users.map(u => u.id);
      const available = response.users.filter((user: any) => !assignedUserIds.includes(user.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    }
  };

  const handleToggleDefault = async (checked: boolean) => {
    try {
      await departmentsService.setDepartmentAsDefault(departmentId, checked);
      // Actualizar estado local inmediatamente
      setIsDefault(checked);
      
      toast.success(checked 
        ? 'Acceso público habilitado - Cualquier usuario puede crear tickets'
        : 'Acceso restringido - Solo usuarios específicos pueden crear tickets'
      );
      
      // Recargar usuarios si se deshabilitó el acceso universal
      if (!checked) {
        await loadUsersWithAccess();
      } else {
        // Si se habilitó, limpiar la lista de usuarios
        setUsers([]);
      }
      
      // Notificar al componente padre para actualizar la tabla
      onToggleDefault();
    } catch (error) {
      console.error('Error al cambiar modo de acceso:', error);
      toast.error('Error al cambiar el modo de acceso');
      // Revertir el estado si hubo error
      setIsDefault(!checked);
    }
  };

  const handleGrantAccess = async (userId: string) => {
    try {
      // Otorgar acceso sin rol específico (solo para crear tickets)
      await departmentsService.grantUserAccessToDepartment(departmentId, userId);
      toast.success('Acceso otorgado exitosamente');
      await loadUsersWithAccess();
      await loadAvailableUsers();
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error('Error al otorgar acceso:', error);
      toast.error('Error al otorgar acceso');
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Revocar Acceso',
      message: '¿Estás seguro de revocar el acceso de este usuario para crear tickets en este departamento?',
      confirmText: 'Revocar',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    
    if (!confirmed) return;

    try {
      await departmentsService.revokeUserAccessFromDepartment(departmentId, userId);
      toast.success('Acceso revocado exitosamente');
      await loadUsersWithAccess();
      await loadAvailableUsers();
    } catch (error) {
      console.error('Error al revocar acceso:', error);
      toast.error('Error al revocar acceso');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Acceso para Crear Tickets"
        subtitle={departmentName}
        size="lg"
        footer={
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        }
      >
        <div>
          {/* Switch para acceso universal */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <FiUsers className="text-blue-600 dark:text-blue-300 text-xl" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Acceso público para crear tickets
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDefault 
                      ? '✓ Cualquier usuario puede crear tickets libremente'
                      : '○ Solo usuarios con acceso específico pueden crear tickets'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isDefault && (
                  <Badge variant="success" size="sm">Habilitado</Badge>
                )}
                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleDefault(!isDefault)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDefault 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDefault ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de usuarios con acceso (solo si no es por defecto) */}
          {!isDefault && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Usuarios con Acceso ({users.length})
                </h3>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiUserPlus />
                  Otorgar Acceso
                </button>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <FiUsers className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>No hay usuarios con acceso específico</p>
                  <p className="text-sm mt-1">Otorga acceso a usuarios para que puedan crear tickets</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-300 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="info" size="sm">
                          Puede crear tickets
                        </Badge>
                        <button
                          onClick={() => handleRevokeAccess(user.id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2"
                          title="Revocar acceso"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mensaje informativo si es por defecto */}
          {isDefault && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <FiUsers className="text-green-600 dark:text-green-400 text-xl mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                    Acceso Público Habilitado
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-400">
                    Cualquier usuario del sistema puede crear tickets libremente en este departamento. 
                    No es necesario asignar usuarios específicos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <AssignTicketAccessModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleGrantAccess}
        availableUsers={availableUsers}
      />

      <ConfirmDialog
        isOpen={confirmIsOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
