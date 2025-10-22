import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { DatabaseModule } from '../config/database.module.js';
import { PasswordService } from '../common/services/password.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, PasswordService],
  controllers: [UsersController],
  exports: [UsersService, PasswordService],
})
export class UsersModule {
  // Module for user management
}
