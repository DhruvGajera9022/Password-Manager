import { User } from '@entities/users/users.entity';
import { PickType } from '@nestjs/swagger';

export class UserRegisterDto extends PickType(User, [
  'name',
  'email',
  'password',
]) {}
