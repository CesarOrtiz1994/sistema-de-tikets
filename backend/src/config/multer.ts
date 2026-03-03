import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Tipos de archivo permitidos
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/csv'
];

export const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Límites de tamaño (en bytes)
export const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB

// Crear directorios si no existen
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Determinar carpeta según tipo de archivo
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const baseDir = isImage ? 'uploads/images' : 'uploads/documents';
    const uploadPath = path.join(baseDir, String(year), month);
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;
    cb(null, filename);
  }
});

// Filtro de archivos
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

// Configuración de Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE, // Límite máximo (documentos)
    files: 10 // Máximo 10 archivos por request
  }
});

// Middleware para validar tamaño según tipo
export const validateFileSize = (req: any, res: any, next: any) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];
  
  for (const file of files) {
    if (!file) continue;
    
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
    
    if (file.size > maxSize) {
      // Eliminar archivo si excede el tamaño
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: `El archivo ${file.originalname} excede el tamaño máximo permitido (${maxSize / 1024 / 1024}MB)`
      });
    }
  }
  
  next();
};
