import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`CAMBIAZO API running on port ${port}`);
}

if (process.env['NODE_ENV'] !== 'test') {
  void bootstrap();
}
