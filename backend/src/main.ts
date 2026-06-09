import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Capture raw body for Clerk webhook signature verification
    rawBody: true,
  });

  // Security headers
  app.use(helmet());

  // CORS — allow frontend origin
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o.trim()))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Store raw body on request object for webhook verification
  app.use('/webhooks', (req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk; });
    req.on('end', () => { req.rawBody = Buffer.from(data); next(); });
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}
bootstrap();
