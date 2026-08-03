import { Module } from '@nestjs/common';
import { LocalUploadProvider } from './local-upload.provider';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [LocalUploadProvider, UploadsService],
  exports: [LocalUploadProvider, UploadsService],
})
export class UploadsModule {}
