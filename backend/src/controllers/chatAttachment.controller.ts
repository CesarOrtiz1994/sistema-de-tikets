import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

export const chatAttachmentController = {
  async uploadAttachment(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }

      const { ticketId } = req.params;
      const userId = req.user!.id;

      // Mover archivo de temp a la carpeta final del ticket
      const finalDir = path.join(process.cwd(), 'uploads', 'chat-attachments', ticketId);
      await fs.mkdir(finalDir, { recursive: true });

      const finalPath = path.join(finalDir, req.file.filename);
      await fs.rename(req.file.path, finalPath);

      // Construir URL completa del archivo
      const protocol = req.protocol;
      const host = req.get('host');
      const relativePath = `/uploads/chat-attachments/${ticketId}/${req.file.filename}`;
      const fileUrl = `${protocol}://${host}${relativePath}`;

      logger.info(`Chat attachment uploaded: ${fileUrl} by user ${userId}`);

      return res.json({
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
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
