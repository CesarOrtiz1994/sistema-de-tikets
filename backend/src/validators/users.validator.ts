import { z } from 'zod';
import { RoleType } from '@prisma/client';

export const usersValidators = {
  create: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    roleType: z.nativeEnum(RoleType).optional(),
    language: z.string().optional()
  }),

  update: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    language: z.string().optional(),
    profilePicture: z.string().url().optional()
  }),

  changeRole: z.object({
    roleType: z.nativeEnum(RoleType, { message: 'Rol inválido' })
  })
};
