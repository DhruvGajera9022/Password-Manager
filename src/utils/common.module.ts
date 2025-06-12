import { Module } from '@nestjs/common';
import { CommonService } from '@helper/common.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  providers: [CommonService, JwtWebAuthService, JwtService],
  exports: [CommonService, JwtWebAuthService, JwtService],
})
export class CommonModule {}
