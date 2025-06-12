import { Vault } from '@entities/vault/vault.entity';
import { PartialType } from '@nestjs/swagger';

export class UpdateVaultDto extends PartialType(Vault) {}
