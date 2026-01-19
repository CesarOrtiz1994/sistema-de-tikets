import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { RoleType } from '../../types/permissions';
import DepartmentsManagementPage from '../../pages/DepartmentsManagementPage';
import MyDepartmentPage from '../../pages/MyDepartmentPage';

export default function DepartmentRoute() {
  const { hasRole } = usePermissions();

  // SUPER_ADMIN ve la gestión completa de departamentos
  if (hasRole(RoleType.SUPER_ADMIN)) {
    return <DepartmentsManagementPage />;
  }

  // DEPT_ADMIN ve solo su departamento
  if (hasRole(RoleType.DEPT_ADMIN)) {
    return <MyDepartmentPage />;
  }

  // Otros roles no tienen acceso
  return <Navigate to="/" replace />;
}
