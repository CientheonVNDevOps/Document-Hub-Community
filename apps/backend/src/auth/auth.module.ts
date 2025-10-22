import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { OtpService } from './otp.service';
import { RedisModule } from '../config/redis.module';
import { EmailService } from '../common/services/email.service';
import { UserApprovalService } from '../users/user-approval.service';
import { DatabaseModule } from '../config/database.module';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, OtpService, EmailService, UserApprovalService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
