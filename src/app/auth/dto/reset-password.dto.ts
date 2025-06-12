import { User } from '@entities/users/users.entity';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserResetPasswordDto extends PickType(User, ['password']) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'reset-token-uuid-123456' })
  resetToken: string;
}
