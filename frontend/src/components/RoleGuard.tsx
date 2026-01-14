import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { RoleType } from '../types/permissions';

interface RoleGuardProps {
  children: ReactNode;
  roles?: RoleType[];
  permission?: string;
  fallback?: ReactNode;
}

export const RoleGuard = ({ children, roles, permission, fallback = null }: RoleGuardProps) => {
  const { hasRole, hasPermission, permissions } = usePermissions();

  if (!permissions) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0) {
    if (!hasRole(...roles)) {
      return <>{fallback}</>;
    }
  }

  if (permission) {
    if (!hasPermission(permission as any)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleGuard;
