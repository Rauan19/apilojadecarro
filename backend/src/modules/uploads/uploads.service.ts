import { Injectable, BadRequestException } from '@nestjs/common';
import { LocalUploadProvider, UploadedFileResult } from './local-upload.provider';

@Injectable()
export class UploadsService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(private readonly uploadProvider: LocalUploadProvider) {}

  async uploadSingle(
    file: Express.Multer.File,
    companyId: string,
  ): Promise<UploadedFileResult> {
    this.validateFile(file);
    return this.uploadProvider.save(file, companyId);
  }

  async uploadMany(
    files: Express.Multer.File[],
    companyId: string,
  ): Promise<UploadedFileResult[]> {
    if (!files?.length) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    files.forEach((file) => this.validateFile(file));
    return this.uploadProvider.saveMany(files, companyId);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Arquivo inválido');
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido: ${file.mimetype}`,
      );
    }
  }
}
