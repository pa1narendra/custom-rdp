import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3002', 'tauri://localhost'],
      credentials: true,
    },
  });

  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Signaling server running on http://localhost:${port}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${port}/signaling`);
}

bootstrap();