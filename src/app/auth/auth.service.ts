import { ResetTokenModelService } from '@entities/reset-token/resetToken.model.service';
import { UserModelService } from '@entities/users/users.model.service';
import { CommonService } from '@helper/common.helper.service';
import { JwtWebAuthService } from '@helper/jwt.helper.service';
import { MailService } from '@helper/mail.helper.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICommonResponse } from '@utils/common.type';
import { authResponse, userResponse } from '@utils/constant';
import { RESPONSE } from '@utils/constants';
import {
  IUserData,
  UserForgotPasswordDto,
  UserLoginDto,
  UserRegisterDto,
  UserResetPasswordDto,
} from './dto';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    private readonly userModelService: UserModelService,
    private readonly resetTokenModelService: ResetTokenModelService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtWebAuthService,
    private readonly commonService: CommonService,
  ) {}

  /**
   * Registers a new user.
   * @param registerData - The data needed for user registration.
   * @throws BadRequestException if email is already registered.
   * @returns A common response containing the registered user data.
   */
  async register(
    registerData: UserRegisterDto,
  ): Promise<ICommonResponse<IUserData>> {
    const existingUser = await this.userModelService.findByEmail(
      registerData.email,
    );
    if (existingUser) {
      throw new BadRequestException(authResponse.email_already_registered);
    }

    const hashedPassword = await this.commonService.hashPassword(
      registerData.password,
    );

    const newUser = await this.userModelService.createUser(
      registerData,
      hashedPassword,
    );

    if (!newUser) {
      throw new BadRequestException(userResponse.user_not_created);
    }

    const { token } = await this.jwtService.generateToken(newUser._id);

    const data = {
      _id: newUser?._id || '',
      name: newUser?.name || '',
      email: newUser?.email || '',
      token,
    };

    return {
      status: RESPONSE.SUCCESS,
      message: userResponse.register_successful,
      data,
    };
  }

  /**
   * Authenticates a user and generates a JWT token.
   * @param loginData - The login credentials.
   * @throws NotFoundException if user email is not found.
   * @throws BadRequestException if password is invalid.
   * @returns A common response containing user data and JWT token.
   */
  async userLogin(
    loginData: UserLoginDto,
  ): Promise<ICommonResponse<IUserData>> {
    const user = await this.userModelService.findByEmail(loginData.email);
    if (!user) {
      throw new NotFoundException(userResponse.user_not_found);
    }

    const isValidPassword = await this.commonService.comparePassword(
      loginData.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new BadRequestException(authResponse.invalid_credential);
    }

    const { token } = await this.jwtService.generateToken(user._id);

    const data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    };

    return {
      status: RESPONSE.SUCCESS,
      message: userResponse.login_successful,
      data,
    };
  }

  /**
   * Handles the forgot password process by generating and emailing a reset token.
   * @param forgotPasswordData - Contains the email of the user requesting password reset.
   * @throws NotFoundException if the email is invalid or not registered.
   * @returns A common response indicating the reset email was sent successfully.
   */
  async forgotPassword(
    forgotPasswordData: UserForgotPasswordDto,
  ): Promise<ICommonResponse<string>> {
    const user = await this.userModelService.findByEmail(
      forgotPasswordData.email,
    );
    if (!user) {
      throw new NotFoundException(userResponse.user_not_found);
    }

    const expire_at = new Date();
    expire_at.setUTCMinutes(expire_at.getUTCMinutes() + 15);

    const token = nanoid(64);

    await this.resetTokenModelService.createResetToken(
      token,
      user._id,
      expire_at,
    );

    await this.mailService.sendResetPasswordMail(
      forgotPasswordData.email,
      token,
    );

    return {
      status: RESPONSE.SUCCESS,
      message: userResponse.email_send_successfully,
    };
  }

  /**
   * Resets the user's password if the provided reset token is valid.
   * Updates the password and extends the token's expiry.
   * @param resetPasswordData - Contains new password and reset token.
   * @throws BadRequestException if the token is invalid or expired.
   * @returns A common response confirming the password was updated successfully.
   */
  async resetPassword(
    resetPasswordData: UserResetPasswordDto,
  ): Promise<ICommonResponse<string>> {
    const { password, resetToken } = resetPasswordData;

    const token = await this.resetTokenModelService.getResetToken(resetToken);
    if (!token) {
      throw new BadRequestException(authResponse.token_not_found);
    }

    const hashedPassword = await this.commonService.hashPassword(password);

    await this.userModelService.updatePassword(token.user_id, hashedPassword);

    const newExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes extension

    await this.resetTokenModelService.updateToken(resetToken, newExpiry);

    return {
      status: RESPONSE.SUCCESS,
      message: authResponse.password_updated_successfully,
    };
  }
}
