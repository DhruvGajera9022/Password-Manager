import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { authResponse, commonResponse, userResponse } from '@utils/constant';
import { BadRequestResponse, InternalServerErrorResponse } from '@utils/dto';
import { AuthService } from './auth.service';
import {
  IUserData,
  UserForgotPasswordDto,
  UserForgotPasswordResponse,
  UserLoginDto,
  UserLoginSuccessResponse,
  UserRegisterDto,
  UserRegisterSuccessResponse,
  UserResetPasswordDto,
  UserResetPasswordResponse,
} from './dto';
import { ICommonResponse } from '@utils/common.type';

@ApiTags('Authentication')
@Controller('v1/auth')
@ApiBadRequestResponse({
  type: BadRequestResponse,
  description: commonResponse.bad_request,
})
@ApiInternalServerErrorResponse({
  type: InternalServerErrorResponse,
  description: commonResponse.internal_server_error,
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'This API is for login of user',
    description: 'This API is for login of user',
  })
  @ApiCreatedResponse({
    description: userResponse.register_successful,
    type: UserRegisterSuccessResponse,
  })
  register(
    @Body() registerData: UserRegisterDto,
  ): Promise<ICommonResponse<IUserData>> {
    return this.authService.register(registerData);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This API is for login of user',
    description: 'This API is for login of user',
  })
  @ApiOkResponse({
    type: UserLoginSuccessResponse,
    description: userResponse.login_successful,
  })
  login(@Body() loginData: UserLoginDto): Promise<ICommonResponse<IUserData>> {
    return this.authService.userLogin(loginData);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This API is for forgot-password for user',
    description: 'This API is for forgot-password for user',
  })
  @ApiOkResponse({
    type: UserForgotPasswordResponse,
    description: authResponse.reset_password_email_sent,
  })
  forgotPassword(
    @Body() forgotPasswordData: UserForgotPasswordDto,
  ): Promise<ICommonResponse<string>> {
    return this.authService.forgotPassword(forgotPasswordData);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'This API is for reset-password for user',
    description: 'This API is for reset-password for user',
  })
  @ApiOkResponse({
    type: UserResetPasswordResponse,
    description: authResponse.password_updated_successfully,
  })
  resetPassword(
    @Body() resetPasswordData: UserResetPasswordDto,
  ): Promise<ICommonResponse<string>> {
    return this.authService.resetPassword(resetPasswordData);
  }
}
