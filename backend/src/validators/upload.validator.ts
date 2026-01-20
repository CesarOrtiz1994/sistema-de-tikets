import { z } from 'zod';

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const uploadFileSchema = z.object({
  fieldId: z.string().uuid('El ID del campo debe ser un UUID válido').optional(),
  category: z.enum(['image', 'document', 'attachment']).optional(),
  processImage: z.boolean().optional().default(false),
  createThumbnail: z.boolean().optional().default(false)
});

export const deleteFileSchema = z.object({
  filePath: z.string().min(1, 'La ruta del archivo es requerida')
});

export const uploadMultipleSchema = z.object({
  fieldId: z.string().uuid('El ID del campo debe ser un UUID válido').optional(),
  maxFiles: z.number().int().min(1).max(10).optional().default(5)
});
