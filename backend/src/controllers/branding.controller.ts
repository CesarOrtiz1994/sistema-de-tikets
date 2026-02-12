import { Request, Response } from 'express';
import brandingService from '../services/branding.service';
import { cacheService } from '../services/cache.service';
import logger from '../config/logger';
import { upload } from '../config/multer';

// Multer middleware para logos (max 2MB, solo imágenes)
export const logoUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logoSmall', maxCount: 1 },
  { name: 'loginBgImage', maxCount: 1 },
]);

export class BrandingController {
  // GET /api/branding - Público (no requiere auth, el login lo necesita)
  async getActiveBranding(_req: Request, res: Response) {
    try {
      logger.info('[Branding] GET /api/branding called');
      const cached = await cacheService.get('branding:active');
      if (cached) {
        logger.info('[Branding] Returning cached branding');
        return res.json(cached);
      }

      const branding = await brandingService.getActiveBranding();
      logger.info('[Branding] Fetched from DB:', JSON.stringify(branding));

      await cacheService.set('branding:active', branding, 3600); // 1 hora
      return res.json(branding);
    } catch (error) {
      logger.error('[Branding] Error getting branding:', error);
      return res.status(500).json({
        message: 'Error al obtener configuración de branding',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /api/branding - Solo SUPER_ADMIN
  async updateBranding(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      logger.info('[Branding] PUT /api/branding called by user:', userId);
      logger.info('[Branding] Request body:', JSON.stringify(req.body));

      const {
        appName,
        logoUrl,
        logoSmallUrl,
        primaryColor,
        secondaryColor,
        sidebarBgColor,
        sidebarTextColor,
        loginBgType,
        loginBgValue,
        loginBgImageUrl,
      } = req.body;

      const dataToUpdate = {
        appName,
        logoUrl,
        logoSmallUrl,
        primaryColor,
        secondaryColor,
        sidebarBgColor,
        sidebarTextColor,
        loginBgType,
        loginBgValue,
        loginBgImageUrl,
      };
      logger.info('[Branding] Data to update:', JSON.stringify(dataToUpdate));

      const branding = await brandingService.updateBranding(dataToUpdate, userId);
      logger.info('[Branding] Updated successfully:', JSON.stringify(branding));

      // Invalidar cache
      await cacheService.del('branding:active');

      return res.json(branding);
    } catch (error) {
      logger.error('[Branding] Error updating branding:', error);
      return res.status(500).json({
        message: 'Error al actualizar configuración de branding',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /api/branding/upload-logo - Solo SUPER_ADMIN
  async uploadLogo(req: Request, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ message: 'No se subió ningún archivo' });
      }

      const result: Record<string, string> = {};

      if (files.logo?.[0]) {
        result.logoUrl = `/${files.logo[0].path.replace(/\\/g, '/')}`;
      }
      if (files.logoSmall?.[0]) {
        result.logoSmallUrl = `/${files.logoSmall[0].path.replace(/\\/g, '/')}`;
      }
      if (files.loginBgImage?.[0]) {
        result.loginBgImageUrl = `/${files.loginBgImage[0].path.replace(/\\/g, '/')}`;
      }

      return res.json(result);
    } catch (error) {
      logger.error('Error uploading branding files:', error);
      return res.status(500).json({
        message: 'Error al subir archivos de branding',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new BrandingController();
