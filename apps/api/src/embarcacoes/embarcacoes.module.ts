import { Module } from '@nestjs/common';
import { EmbarcacoesController } from './embarcacoes.controller';
import { EmbarcacoesService } from './embarcacoes.service';
import { MotoresModule } from '../motores/motores.module';
import { CascoPinturaModule } from '../casco-pintura/casco-pintura.module';

@Module({
  imports: [MotoresModule, CascoPinturaModule],
  controllers: [EmbarcacoesController],
  providers: [EmbarcacoesService],
})
export class EmbarcacoesModule {}
