import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignUserToDepartment,
  removeUserFromDepartment,
  getDepartmentUsers,
  getMyAdminDepartments
} from '../controllers/departments.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { auditAction } from '../middlewares/audit.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener departamentos donde el usuario es administrador
router.get('/my-admin-departments', getMyAdminDepartments);

// Obtener todos los departamentos - SUPER_ADMIN ve todos, DEPT_ADMIN solo el suyo
router.get('/', getAllDepartments);

// Obtener un departamento por ID - SUPER_ADMIN y DEPT_ADMIN
router.get('/:id', getDepartmentById);

// Crear departamento - Solo SUPER_ADMIN
router.post('/', authorize('SUPER_ADMIN'), auditAction('CREATE_DEPARTMENT', 'department') as any, createDepartment);

// Actualizar departamento - SUPER_ADMIN (todos los campos) y DEPT_ADMIN (solo su departamento y campos permitidos)
router.put('/:id', authorize('SUPER_ADMIN', 'DEPT_ADMIN'), auditAction('UPDATE_DEPARTMENT', 'department') as any, updateDepartment);

// Eliminar departamento - Solo SUPER_ADMIN
router.delete('/:id', authorize('SUPER_ADMIN'), auditAction('DELETE_DEPARTMENT', 'department') as any, deleteDepartment);

// Obtener usuarios de un departamento - SUPER_ADMIN y DEPT_ADMIN
router.get('/:id/users', getDepartmentUsers);

// Asignar usuario a departamento - SUPER_ADMIN y DEPT_ADMIN (solo su departamento)
router.post('/:id/users', authorize('SUPER_ADMIN', 'DEPT_ADMIN'), auditAction('ADD_USER_TO_DEPARTMENT', 'department') as any, assignUserToDepartment);

// Remover usuario de departamento - SUPER_ADMIN y DEPT_ADMIN (solo su departamento)
router.delete('/:id/users/:userId', authorize('SUPER_ADMIN', 'DEPT_ADMIN'), auditAction('REMOVE_USER_FROM_DEPARTMENT', 'department') as any, removeUserFromDepartment);

export default router;
