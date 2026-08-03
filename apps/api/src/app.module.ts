import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { EmbarcacoesModule } from './embarcacoes/embarcacoes.module';
import { MotoresModule } from './motores/motores.module';
import { CorreiasModule } from './correias/correias.module';
import { ManutencoesModule } from './manutencoes/manutencoes.module';
import { CascoPinturaModule } from './casco-pintura/casco-pintura.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditoriasModule } from './auditorias/auditorias.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdminModule,
    EmbarcacoesModule,
    MotoresModule,
    CorreiasModule,
    ManutencoesModule,
    CascoPinturaModule,
    NotificationsModule,
    AuditoriasModule,
    HealthModule,
  ],
})
export class AppModule {}
