import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Module({
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseKey = configService.get<string>('SUPABASE_ANON_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase URL and Key not provided, using mock client');
          return {
            from: () => ({
              select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
              insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
              update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
              delete: () => ({ eq: () => ({ data: null, error: null }) }),
              or: () => ({ order: () => ({ data: [], error: null }) })
            })
          };
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test connection and initialize database if needed
        try {
          console.log('🔌 Testing database connection...');
          const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
          
          if (error) {
            console.warn('⚠️  Database connection issue:', error.message);
          } else {
            console.log('✅ Database connection successful');
          }
        } catch (err) {
          console.warn('⚠️  Database connection test failed:', err.message);
        }
        
        return supabase;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class DatabaseModule {}
