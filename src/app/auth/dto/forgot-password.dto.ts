import { User } from '@entities/users/users.entity';
import { PickType } from '@nestjs/swagger';

export class UserForgotPasswordDto extends PickType(User, ['email']) {}
