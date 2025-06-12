import { Vault } from '@entities/vault/vault.entity';
import { PickType } from '@nestjs/swagger';

export class CreateVaultDto extends PickType(Vault, [
  'siteName',
  'username',
  'encryptedPassword',
  'email',
  'phone',
  'notes',
  'favorite',
  'url',
  'tags',
  'category',
  'avatarUrl',
]) {}
