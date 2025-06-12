import { SwaggerResponse } from '@utils/classes';
import { authResponse, userResponse } from '@utils/constant';
import { RESPONSE } from '@utils/constants';
import { UserLoginSuccess, UserRegisterSuccess } from '../doc';

export class UserRegisterSuccessResponse extends SwaggerResponse(
  userResponse.register_successful,
  UserRegisterSuccess,
  RESPONSE.SUCCESS,
) {}

export class UserLoginSuccessResponse extends SwaggerResponse(
  userResponse.login_successful,
  UserLoginSuccess,
  RESPONSE.SUCCESS,
) {}

export class UserForgotPasswordResponse extends SwaggerResponse(
  userResponse.email_send_successfully,
  [],
  RESPONSE.SUCCESS,
) {}

export class UserResetPasswordResponse extends SwaggerResponse(
  authResponse.password_updated_successfully,
  [],
  RESPONSE.SUCCESS,
) {}
