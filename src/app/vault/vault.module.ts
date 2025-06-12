import { Module } from '@nestjs/common';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { VaultModelService } from '@entities/vault/vault.model.service';
import { VaultModel } from '@entities/vault/vault.entity';
import { CommonModule } from '@utils/common.module';

@Module({
  imports: [VaultModel, CommonModule],
  controllers: [VaultController],
  providers: [VaultService, VaultModelService],
})
export class VaultModule {}
