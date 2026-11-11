import { describe, it, expect, afterEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
import { FilesService } from '../src/modules/files/files.service.js';
import { FilesController } from '../src/modules/files/files.controller.js';

describe('Files Upload & Serving (products-app FormData flow)', () => {
  const createdFiles: string[] = [];
  const filesService = new FilesService();
  const filesController = new FilesController(filesService);

  afterEach(() => {
    for (const filePath of createdFiles.splice(0, createdFiles.length)) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  it('saves uploaded image via FilesController and resolves it cleanly', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = filesController.uploadImage(
      {
        originalname: 'foto-regla.png',
        mimetype: 'image/png',
        buffer: pngHeader,
        size: pngHeader.length,
      },
      {
        protocol: 'http',
        get: (header: string) => (header.toLowerCase() === 'host' ? '192.168.0.15:3010' : undefined),
      },
    );

    expect(res.filename).toMatch(/\.png$/);
    expect(res.url).toBe(`http://192.168.0.15:3010/api/v1/files/${res.filename}`);
    expect(res.image).toBe(res.url);

    const resolved = filesService.resolveImageFile(res.filename);
    createdFiles.push(resolved.filePath);
    expect(resolved.contentType).toBe('image/png');
    expect(fs.readFileSync(resolved.filePath)).toEqual(pngHeader);
  });

  it('rejects non-image uploads and path traversal attempts', () => {
    expect(() =>
      filesService.saveUploadedImage({
        originalname: 'script.js',
        mimetype: 'application/javascript',
        buffer: Buffer.from('console.log(1)'),
      }),
    ).toThrowError(BadRequestException);

    expect(() => filesService.resolveImageFile('../secret.jpg')).toThrowError(
      BadRequestException,
    );

    expect(() => filesService.resolveImageFile('missing-file.jpg')).toThrowError(
      NotFoundException,
    );
  });
});

