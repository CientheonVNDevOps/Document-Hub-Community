import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('UPSTASH_REDIS_REST_URL');
        const redisToken = configService.get<string>('UPSTASH_REDIS_REST_TOKEN');
        
        if (!redisUrl || !redisToken) {
          console.warn('Redis URL and Token not provided, using mock client');
          return {
            setex: async () => 'OK',
            get: async () => null,
            del: async () => 1,
            incr: async () => 1,
            expire: async () => 1
          };
        }
        
        return new Redis({
          url: redisUrl,
          token: redisToken,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
