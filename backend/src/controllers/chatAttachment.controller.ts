import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '../config/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleType: string;
  };
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.pdf'];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Tipos de imagen que se pueden comprimir
const COMPRESSIBLE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// Configuración de compresión
const IMAGE_COMPRESSION_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'jpeg' as const
};

// Configurar multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'chat-attachments', 'temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

/**
 * Comprime una imagen usando Sharp.
 * Los PNG se mantienen como PNG para conservar la transparencia (JPEG no soporta canal alfa).
 */
async function compressImage(
  inputPath: string,
  outputPath: string,
  keepPng: boolean
): Promise<{ size: number; width: number; height: number; resized: boolean }> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Redimensionar si es necesario
  let processedImage = image;
  if (metadata.width && metadata.width > IMAGE_COMPRESSION_CONFIG.maxWidth) {
    processedImage = processedImage.resize(IMAGE_COMPRESSION_CONFIG.maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }
  if (metadata.height && metadata.height > IMAGE_COMPRESSION_CONFIG.maxHeight) {
    processedImage = processedImage.resize(null, IMAGE_COMPRESSION_CONFIG.maxHeight, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  if (keepPng) {
    await processedImage.png({ compressionLevel: 9, effort: 7 }).toFile(outputPath);
  } else {
    await processedImage
      .jpeg({ quality: IMAGE_COMPRESSION_CONFIG.quality, progressive: true })
      .toFile(outputPath);
  }

  const stats = await fs.stat(outputPath);
  const finalMetadata = await sharp(outputPath).metadata();

  return {
    size: stats.size,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    resized: finalMetadata.width !== metadata.width || finalMetadata.height !== metadata.height
  };
}

export const chatAttachmentController = {
  async uploadAttachment(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }

      const { ticketId } = req.params;
      const userId = req.user!.id;

      // Crear directorio final
      const finalDir = path.join(process.cwd(), 'uploads', 'chat-attachments', ticketId);
      await fs.mkdir(finalDir, { recursive: true });

      const isCompressibleImage = COMPRESSIBLE_IMAGE_TYPES.includes(req.file.mimetype);
      let finalPath: string;
      let finalSize: number;
      let finalMimeType: string;

      if (isCompressibleImage) {
        // Comprimir imagen (los PNG siguen siendo PNG para no perder la transparencia)
        const originalSize = req.file.size;
        const isPng = req.file.mimetype === 'image/png';
        const compressedFilename = `${path.parse(req.file.filename).name}${isPng ? '.png' : '.jpg'}`;
        finalPath = path.join(finalDir, compressedFilename);

        logger.info(`[ChatAttachment] Compressing image: ${req.file.originalname} (${(originalSize / 1024).toFixed(2)} KB)`);

        const compressionResult = await compressImage(req.file.path, finalPath, isPng);
        finalSize = compressionResult.size;
        finalMimeType = isPng ? 'image/png' : 'image/jpeg';

        // Si el PNG recomprimido pesa más y no se redimensionó, se conserva el original
        if (isPng && !compressionResult.resized && finalSize >= originalSize) {
          await fs.unlink(finalPath);
          finalPath = path.join(finalDir, req.file.filename);
          await fs.rename(req.file.path, finalPath);
          finalSize = originalSize;
        } else {
          // Eliminar archivo temporal original
          await fs.unlink(req.file.path);
        }

        const compressionRatio = ((1 - finalSize / originalSize) * 100).toFixed(2);
        logger.info(`[ChatAttachment] Image compressed: ${(finalSize / 1024).toFixed(2)} KB (${compressionRatio}% reduction)`);
      } else {
        // No comprimir (PDF, SVG, etc.)
        finalPath = path.join(finalDir, req.file.filename);
        await fs.rename(req.file.path, finalPath);
        finalSize = req.file.size;
        finalMimeType = req.file.mimetype;

        logger.info(`[ChatAttachment] File uploaded without compression: ${req.file.originalname}`);
      }

      // Construir URL completa del archivo
      const protocol = req.protocol;
      const host = req.get('host');
      const filename = path.basename(finalPath);
      const relativePath = `/uploads/chat-attachments/${ticketId}/${filename}`;
      const fileUrl = `${protocol}://${host}${relativePath}`;

      logger.info(`[ChatAttachment] Upload complete: ${fileUrl} by user ${userId}`);

      return res.json({
        url: fileUrl,
        name: req.file.originalname,
        type: finalMimeType,
        size: finalSize,
        compressed: isCompressibleImage
      });
    } catch (error) {
      logger.error('Error uploading chat attachment:', error);
      
      // Limpiar archivo temporal si existe
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting temp file:', unlinkError);
        }
      }

      return res.status(500).json({ error: 'Error al subir el archivo' });
    }
  }
};
