import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { DashboardController } from './dashboard.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, DashboardController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
