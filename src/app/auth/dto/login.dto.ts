import { User } from '@entities/users/users.entity';
import { PickType } from '@nestjs/swagger';

export class UserLoginDto extends PickType(User, ['email', 'password']) {}
