import { EnvConfig } from '@config/env.config.module';
import { DatabaseModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvConfig,
    DatabaseModule.forRoot(process.env.DB_URI || ''),
  ],
  exports: [EnvConfig, DatabaseModule],
})
export class TestConfigModule {}
