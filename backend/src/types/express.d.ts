import { RoleType } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        roleType: RoleType | string;
      };
    }
  }
}

export {};
