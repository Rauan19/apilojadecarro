import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesRepository } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [UploadsModule],
  controllers: [VehiclesController],
  providers: [VehiclesRepository, VehiclesService],
  exports: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
