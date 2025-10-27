// Suppress Node.js deprecation warnings
process.removeAllListeners('warning');
process.on('warning', () => {});
process.env.NODE_NO_WARNINGS = '1';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Initialize database with default admin user if needed
  console.log('🔧 Initializing database...');
  try {
    const usersService = app.get(UsersService);
    const result = await usersService.initializeDatabase();
    console.log(`✅ Database initialization completed. ${result.userCount} user(s) found.`);
  } catch (error) {
    console.error('⚠️  Database initialization failed:', error.message);
    console.error('Stack trace:', error.stack);
    // Don't block startup if database initialization fails
  }

  // Set global prefix (but exclude health endpoint)
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  // Enable CORS
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.enableCors({
    origin: (origin, callback) => {
      // In development, use specific allowed origins
      if (!isProduction) {
        const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3003';
        if (!origin || origin === allowedOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
        return;
      }
      
      // In production, allow any origin from the sslip.io subdomain or explicitly allowed
      const sslipPattern = /https?:\/\/[a-z0-9]+\.72\.60\.41\.15\.sslip\.io/;
      const allowedOrigins = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
        : [];
      
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Check if origin matches sslip.io pattern or is in allowed list
      if (sslipPattern.test(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Note Taking API')
    .setDescription('API for note-taking application with tree structure and versioning')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`Backend server running on http://${host}:${port}`);
  console.log(`API Documentation available at http://${host}:${port}/api/docs`);
}

bootstrap();
