import { Module } from '@nestjs/common';
import { CascoPinturaController } from './casco-pintura.controller';
import { CascoPinturaService } from './casco-pintura.service';

@Module({
  controllers: [CascoPinturaController],
  providers: [CascoPinturaService],
  exports: [CascoPinturaService],
})
export class CascoPinturaModule {}
