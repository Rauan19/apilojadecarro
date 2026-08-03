import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompanyId, CurrentUser, Roles } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Upload de imagem única' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CompanyId() companyId: string | null,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const resolvedCompanyId = companyId || user.companyId;
    if (!resolvedCompanyId) {
      throw new BadRequestException('companyId é obrigatório para upload');
    }
    const data = await this.uploadsService.uploadSingle(file, resolvedCompanyId);
    return { message: 'Upload realizado com sucesso', data };
  }

  @Post('images')
  @Roles(Role.SUPER_ADMIN, Role.STORE_ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Upload de múltiplas imagens' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @CompanyId() companyId: string | null,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const resolvedCompanyId = companyId || user.companyId;
    if (!resolvedCompanyId) {
      throw new BadRequestException('companyId é obrigatório para upload');
    }
    const data = await this.uploadsService.uploadMany(files, resolvedCompanyId);
    return { message: 'Uploads realizados com sucesso', data };
  }
}
