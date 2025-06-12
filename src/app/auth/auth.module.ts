import { ResetTokenModel } from '@entities/reset-token/resetToken.entity';
import { UserModel } from '@entities/users/users.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { CommonModule } from '@utils/common.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModelService } from '@entities/users/users.model.service';
import { ResetTokenModelService } from '@entities/reset-token/resetToken.model.service';
import { MailService } from '@helper/mail.helper.service';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UserModel,
    ResetTokenModel,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserModelService,
    ResetTokenModelService,
    MailService,
  ],
  exports: [PassportModule],
})
export class AuthModule {}
