import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@common/logger/logger.config';
import { MyLogger } from '@common/logger/logger.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@db/db.module';
import { AuthModule } from './auth/auth.module';
import { VaultModule } from './vault/vault.module';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule.forRoot(process.env.DB_URI || ''),

    AuthModule,
    VaultModule,
  ],
  controllers: [AppController],
  providers: [AppService, MyLogger],
})
export class AppModule {}
