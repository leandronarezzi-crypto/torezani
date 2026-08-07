import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { ClientesModule } from './clientes/clientes.module';
import { ContratosModule } from './contratos/contratos.module';
import { CentrosCustoModule } from './centros-custo/centros-custo.module';
import { DespesasModule } from './despesas/despesas.module';
import { ReceitasModule } from './receitas/receitas.module';
import { AuditoriaLogInterceptor } from './common/interceptors/auditoria-log.interceptor';

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
    ClientesModule,
    ContratosModule,
    CentrosCustoModule,
    DespesasModule,
    ReceitasModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaLogInterceptor,
    },
  ],
})
export class AppModule {}
