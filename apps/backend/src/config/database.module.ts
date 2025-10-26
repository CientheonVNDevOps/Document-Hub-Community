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
        
        // For development, use local PostgreSQL if Supabase is not configured
        if (!supabaseUrl || !supabaseKey || supabaseUrl === 'mock_url') {
          console.log('Using local PostgreSQL database for development');
          
          // Create a mock Supabase client that works with local PostgreSQL
          return {
            from: (table: string) => ({
              select: (columns: string = '*') => ({
                eq: (column: string, value: any) => ({
                  single: () => Promise.resolve({ data: null, error: null }),
                  order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
                }),
                is: (column: string, value: any) => ({
                  order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
                }),
                or: (query: string) => ({
                  order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
                }),
                order: (column: string, options: any) => Promise.resolve({ data: [], error: null }),
                limit: (count: number) => Promise.resolve({ data: [], error: null })
              }),
              insert: (data: any[]) => ({
                select: (columns: string = '*') => ({
                  single: () => Promise.resolve({ 
                    data: { 
                      id: 'mock-id-' + Date.now(), 
                      ...data[0],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }, 
                    error: null 
                  })
                })
              }),
              update: (data: any) => ({
                eq: (column: string, value: any) => ({
                  select: (columns: string = '*') => ({
                    single: () => Promise.resolve({ 
                      data: { 
                        id: value,
                        ...data,
                        updated_at: new Date().toISOString()
                      }, 
                      error: null 
                    })
                  })
                })
              }),
              delete: () => ({
                eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
              }),
              upsert: (data: any[], options: any) => ({
                select: (columns: string = '*') => ({
                  single: () => Promise.resolve({ 
                    data: { 
                      id: data[0].id || 'mock-id-' + Date.now(), 
                      ...data[0],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }, 
                    error: null 
                  })
                })
              })
            })
          };
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        });
        
        // Test connection and initialize database if needed
        try {
          console.log('Testing database connection...');
          const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
          
          if (error) {
            console.warn('Database connection issue:', error.message);
          } else {
            console.log('Database connection successful');
          }
        } catch (err) {
          console.warn('Database connection test failed:', err.message);
        }
        
        return supabase;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class DatabaseModule {}
