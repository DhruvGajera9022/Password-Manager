import {
  UserForgotPasswordDto,
  UserLoginDto,
  UserRegisterDto,
  UserResetPasswordDto,
} from '@app/auth/dto';
import { expectObjectId } from './common.constants';

export const baseUserData: UserRegisterDto = {
  name: 'test',
  email: 'test@gmail.com',
  password: 'test@1234',
};

export const USER_REGISTER_DATA: UserRegisterDto = {
  name: baseUserData.name,
  email: baseUserData.email,
  password: baseUserData.password,
};

export const USER_LOGIN_DATA: UserLoginDto = {
  email: baseUserData.email,
  password: baseUserData.password,
};

export const USER_LOGIN_INVALID_EMAIL: UserLoginDto = {
  email: 'hello@gmail.com',
  password: baseUserData.password,
};

export const USER_LOGIN_INVALID_PASSWORD: UserLoginDto = {
  email: baseUserData.email,
  password: 'wrong@123',
};

export const USER_FORGOT_PASSWORD_EMAIL: UserForgotPasswordDto = {
  email: baseUserData.email,
};

export const USER_RESET_PASSWORD_TOKEN: UserResetPasswordDto = {
  resetToken: 'valid-token-123567890',
  password: 'new@1234',
};

export const USER_TEST_DATA = {
  id: '',
};

export const createUserExpectedResponse = {
  _id: expectObjectId,
  name: baseUserData.name,
  email: baseUserData.email,
};
