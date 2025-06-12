import { TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthModule } from './auth.module';

import { MailService } from '@helper/mail.helper.service';
import { CommonModule } from '@utils/common.module';
import { UserModelService } from '@entities/users/users.model.service';
import { ResetTokenModelService } from '@entities/reset-token/resetToken.model.service';
import { UserModel } from '@entities/users/users.entity';
import { ResetTokenModel } from '@entities/reset-token/resetToken.entity';

import {
  USER_REGISTER_DATA,
  USER_LOGIN_DATA,
  USER_LOGIN_INVALID_EMAIL,
  USER_LOGIN_INVALID_PASSWORD,
  USER_FORGOT_PASSWORD_EMAIL,
  USER_RESET_PASSWORD_TOKEN,
} from '@test/constants/user.constants';
import { RESPONSE } from '@utils/constants';
import { userResponse, authResponse } from '@utils/constant';

import { closeConnection, setupTestingModule } from '@test/test-setup';

jest.setTimeout(10000);

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let userModelService: UserModelService;
  let resetTokenService: ResetTokenModelService;
  let connection: Connection;
  let app: TestingModule;

  beforeAll(async () => {
    app = await setupTestingModule(
      [UserModel, ResetTokenModel, AuthModule, CommonModule],
      [AuthController],
      [AuthService, UserModelService, ResetTokenModelService, MailService],
    );

    controller = app.get(AuthController);
    service = app.get(AuthService);
    userModelService = app.get(UserModelService);
    resetTokenService = app.get(ResetTokenModelService);
    connection = app.get(getConnectionToken());
  });

  afterAll(async () => {
    await closeConnection(connection);
    await app.close();
  });

  beforeEach(async () => {
    await connection.collection('users').deleteMany({});
    await connection.collection('resettokens').deleteMany({});
  });

  describe('POST /register', () => {
    it('should register a user successfully', async () => {
      const response = await controller.register(USER_REGISTER_DATA);

      expect(response.status).toBe(RESPONSE.SUCCESS);
      expect(response.message).toBe(userResponse.register_successful);
      expect(response.data?.email).toBe(USER_REGISTER_DATA.email);
    });

    it('should throw error if email already registered', async () => {
      await controller.register(USER_REGISTER_DATA);

      await expect(controller.register(USER_REGISTER_DATA)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await controller.register(USER_REGISTER_DATA);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await controller.login(USER_LOGIN_DATA);

      expect(response.status).toBe(RESPONSE.SUCCESS);
      expect(response.message).toBe(userResponse.login_successful);
      expect(response.data?.token).toBeDefined();
    });

    it('should throw NotFoundException for unregistered email', async () => {
      await expect(controller.login(USER_LOGIN_INVALID_EMAIL)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for wrong password', async () => {
      await expect(
        controller.login(USER_LOGIN_INVALID_PASSWORD),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /forgot-password', () => {
    beforeEach(async () => {
      await controller.register(USER_REGISTER_DATA);
    });

    it('should send reset token email successfully', async () => {
      const response = await controller.forgotPassword(
        USER_FORGOT_PASSWORD_EMAIL,
      );

      expect(response.status).toBe(RESPONSE.SUCCESS);
      expect(response.message).toBe(userResponse.email_send_successfully);

      const user = await userModelService.findByEmail(USER_REGISTER_DATA.email);
      const token = await resetTokenService.findByUserId(user!._id);
      expect(token?.token).toHaveLength(64);
    });

    it('should throw NotFoundException for non-existent email', async () => {
      await expect(
        controller.forgotPassword({ email: 'invalid@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password successfully with valid token', async () => {
      await controller.register(USER_REGISTER_DATA);
      const user = await userModelService.findByEmail(USER_REGISTER_DATA.email);

      await resetTokenService.createResetToken(
        USER_RESET_PASSWORD_TOKEN.resetToken,
        user!._id,
        new Date(Date.now() + 15 * 60 * 1000),
      );

      const response = await controller.resetPassword(
        USER_RESET_PASSWORD_TOKEN,
      );

      expect(response.status).toBe(RESPONSE.SUCCESS);
      expect(response.message).toBe(authResponse.password_updated_successfully);
    });

    it('should throw BadRequestException for invalid token', async () => {
      await expect(
        controller.resetPassword({
          resetToken: 'invalidtoken123',
          password: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
