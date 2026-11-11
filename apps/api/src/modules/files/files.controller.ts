import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'node:fs';
import { Public } from '../../common/auth/public.decorator.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { FilesService, type UploadedImagePayload } from './files.service.js';

interface HttpRequestLike {
  protocol?: string;
  get?: (name: string) => string | undefined;
}

@Controller('api/v1/files')
export class FilesController {
  constructor(
    @Inject(FilesService)
    private readonly filesService: FilesService,
  ) {}

  @Post('upload')
  @Roles('STUDENT', 'PARENT', 'KIOSK', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @UploadedFile() file: UploadedImagePayload | undefined,
    @Req() req: HttpRequestLike,
  ): { filename: string; image: string; url: string } {
    const saved = this.filesService.saveUploadedImage(file);
    const forwardedProto = req.get?.('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host =
      req.get?.('x-forwarded-host')?.split(',')[0]?.trim() ||
      req.get?.('host') ||
      'localhost:3010';
    const url = `${protocol}://${host}/api/v1/files/${saved.filename}`;

    return {
      filename: saved.filename,
      image: url,
      url,
    };
  }

  @Get(':filename')
  @Public()
  getImage(@Param('filename') filename: string): StreamableFile {
    const { filePath, contentType } = this.filesService.resolveImageFile(filename);
    const stream = fs.createReadStream(filePath);
    return new StreamableFile(stream, {
      type: contentType,
      disposition: 'inline',
    });
  }
}

