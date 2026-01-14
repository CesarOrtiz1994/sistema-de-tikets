export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DEPT_ADMIN = 'DEPT_ADMIN',
  SUBORDINATE = 'SUBORDINATE',
  REQUESTER = 'REQUESTER'
}

export interface Permissions {
  canViewOwnProfile: boolean;
  canUpdateOwnProfile: boolean;
  canManageUsers?: boolean;
  canManageDepartments?: boolean;
  canManageTickets?: boolean;
  canViewAllTickets?: boolean;
  canViewAuditLogs?: boolean;
  canManageRoles?: boolean;
  canDeleteUsers?: boolean;
  canRestoreUsers?: boolean;
  canViewAllDepartments?: boolean;
  canCreateDepartments?: boolean;
  canDeleteDepartments?: boolean;
  canManageDepartmentUsers?: boolean;
  canManageDepartmentTickets?: boolean;
  canViewDepartmentTickets?: boolean;
  canAssignTickets?: boolean;
  canViewDepartmentStats?: boolean;
  canManageSubordinates?: boolean;
  canViewAssignedTickets?: boolean;
  canUpdateAssignedTickets?: boolean;
  canCommentOnTickets?: boolean;
  canCreateTickets?: boolean;
  canViewOwnTickets?: boolean;
  canCommentOnOwnTickets?: boolean;
  canCloseOwnTickets?: boolean;
}

export interface Department {
  id: string;
  name: string;
  prefix?: string;
  description?: string;
  isDefaultForRequesters?: boolean;
  role?: string;
  userRole?: RoleType;
}

export interface UserPermissions {
  user: {
    id: string;
    email: string;
    name: string;
    roleType: RoleType;
    isActive: boolean;
  };
  permissions: Permissions;
  departments: Department[];
}
