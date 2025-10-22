import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './config/database.module';
import { RedisModule } from './config/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    NotesModule,
    AdminModule,
  ],
})
export class AppModule {}
