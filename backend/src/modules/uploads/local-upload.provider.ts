import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFileResult {
  filename: string;
  originalName: string;
  url: string;
  path: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class LocalUploadProvider {
  private readonly uploadDest: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDest = this.config.get<string>('UPLOAD_DEST', './uploads');
  }

  ensureCompanyDir(companyId: string): string {
    const dir = path.join(this.uploadDest, `empresa-${companyId}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  async save(
    file: Express.Multer.File,
    companyId: string,
  ): Promise<UploadedFileResult> {
    const dir = this.ensureCompanyDir(companyId);
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const fullPath = path.join(dir, filename);

    await fs.promises.writeFile(fullPath, file.buffer);

    // Path relativo (sem host): o frontend resolve com a origem da API.
    // Evita URLs quebradas quando APP_URL muda (localhost → produção).
    const relativePath = `uploads/empresa-${companyId}/${filename}`.replace(/\\/g, '/');

    return {
      filename,
      originalName: file.originalname,
      url: `/${relativePath}`,
      path: relativePath,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async saveMany(
    files: Express.Multer.File[],
    companyId: string,
  ): Promise<UploadedFileResult[]> {
    const results: UploadedFileResult[] = [];
    for (const file of files) {
      results.push(await this.save(file, companyId));
    }
    return results;
  }

  async delete(relativePath: string): Promise<void> {
    let cleaned = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (cleaned.startsWith('uploads/')) {
      cleaned = cleaned.slice('uploads/'.length);
    }
    // URLs absolutas antigas: extrai só o path após /uploads/
    const match = cleaned.match(/uploads\/(.+)$/);
    if (match) cleaned = match[1];

    const fullPath = path.join(this.uploadDest, cleaned);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }
}
