import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: app.get<ConfigService>(ConfigService).get('CLIENT_ORIGIN'),
    credentials: true,
    exposedHeaders: 'set-cookie',
  });

  const port = app.get<ConfigService>(ConfigService).get('APP_PORT');
  await app.listen(port);
}
bootstrap();
