import { Module } from '@nestjs/common';
import { CorreiasController } from './correias.controller';
import { CorreiasService } from './correias.service';

@Module({
  controllers: [CorreiasController],
  providers: [CorreiasService],
})
export class CorreiasModule {}
