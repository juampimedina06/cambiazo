import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { API_DATA_DIR } from '../../common/persistence/json-file-store.js';

export interface UploadedImagePayload {
  originalname?: string;
  mimetype?: string;
  buffer?: Buffer;
  size?: number;
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export function getUploadsDir(): string {
  return path.join(API_DATA_DIR, 'uploads');
}

@Injectable()
export class FilesService {
  saveUploadedImage(file: UploadedImagePayload | undefined): { filename: string } {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No se recibió ninguna imagen para subir.');
    }

    if (file.buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('La imagen supera el límite máximo de 8 MB.');
    }

    const mime = (file.mimetype || '').toLowerCase();
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const mappedExt = MIME_TO_EXT[mime];
    const resolvedExt = mappedExt || (EXT_TO_MIME[originalExt] ? originalExt : null);

    if (!resolvedExt || (mime && !mime.startsWith('image/'))) {
      throw new BadRequestException(
        'Formato no permitido. Subí una imagen JPG, PNG, WEBP, GIF o HEIC.',
      );
    }

    const uploadsDir = getUploadsDir();
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${randomUUID()}${resolvedExt}`;
    const targetPath = path.join(uploadsDir, filename);
    fs.writeFileSync(targetPath, file.buffer);

    return { filename };
  }

  resolveImageFile(filename: string): { filePath: string; contentType: string } {
    const cleanName = path.basename(filename);
    if (cleanName !== filename || !SAFE_FILENAME_REGEX.test(cleanName)) {
      throw new BadRequestException('Nombre de archivo inválido.');
    }

    const filePath = path.join(getUploadsDir(), cleanName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Imagen no encontrada.');
    }

    const ext = path.extname(cleanName).toLowerCase();
    return {
      filePath,
      contentType: EXT_TO_MIME[ext] || 'application/octet-stream',
    };
  }
}

