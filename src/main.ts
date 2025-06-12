import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import morgan from 'morgan';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from '@filter/global-exception.filter';
import { setupSwagger } from '@doc/swagger.doc';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // init logger
  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8000);
  const nodeEnv = configService.get<string>('ENV', 'DEV');

  // setup morgan
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.log(message.trim()),
      },
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // use logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger documentation setup
  if (nodeEnv === 'DEV') {
    setupSwagger(app);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`);

  if (nodeEnv === 'DEV') {
    setupSwagger(app);
    logger.log(
      `Application documentation is on: ${await app.getUrl()}/api/docs`,
    );
  }
}
bootstrap();
