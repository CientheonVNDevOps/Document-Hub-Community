import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UserApprovalService } from '../users/user-approval.service';
import { EmailService } from '../common/services/email.service';
import { DatabaseModule } from '../config/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [UserApprovalService, EmailService],
  exports: [UserApprovalService, EmailService],
})
export class AdminModule {}
