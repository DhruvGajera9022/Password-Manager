import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
const configService = new ConfigService();

@Injectable()
export class JwtWebAuthService {
  private readonly accessSecretKey: string;
  private readonly jwtExpiry: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecretKey =
      this.configService.get<string>('ACCESS_SECRET_KEY') || 'secret';
    this.jwtExpiry =
      this.configService.get<string>('JWT_EXPIRATION_TIME') || '1h';
  }

  /**
   * @description Generates an access token for the specified user ID.
   * @param {string} userId - The user ID for which the tokens are generated.
   * @param {Role} role - The user role for which the tokens are generated.
   */
  async generateToken(userId: string) {
    const token = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.accessSecretKey,
        expiresIn: this.jwtExpiry,
      },
    );
    return { token };
  }

  async validateToken(token: string) {
    try {
      const decode = this.jwtService.verify(token, {
        secret: this.accessSecretKey,
      });

      return decode;
    } catch (error) {}
  }
}
