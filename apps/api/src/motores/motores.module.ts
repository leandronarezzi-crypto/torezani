import { Module } from '@nestjs/common';
import { MotoresController } from './motores.controller';
import { MotoresService } from './motores.service';

@Module({
  controllers: [MotoresController],
  providers: [MotoresService],
  exports: [MotoresService],
})
export class MotoresModule {}
