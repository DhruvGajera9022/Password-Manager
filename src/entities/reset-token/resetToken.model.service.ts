import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model, now } from 'mongoose';
import { ResetToken } from './resetToken.entity';

@Injectable()
export class ResetTokenModelService {
  constructor(
    @InjectModel(ResetToken.name)
    private readonly resetTokenModel: Model<ResetToken>,
  ) {}

  /**
   * Creates a new reset token document.
   *
   * @param token - The reset token string.
   * @param user_id - The ID of the user associated with the token.
   * @param expire_at - The expiration date/time of the token.
   * @returns The newly created reset token document.
   */
  async createResetToken(
    token: string,
    user_id: string,
    expire_at: Date,
  ): Promise<Object> {
    const newResetToken = await this.resetTokenModel.insertOne({
      token,
      user_id,
      expire_at,
    });

    return newResetToken;
  }

  /**
   * Retrieves a valid reset token along with user info if token is not expired.
   *
   * @param resetToken - The reset token string to find.
   * @returns The reset token document with user details, or null if not found or expired.
   */
  async getResetToken(resetToken: string): Promise<any | null> {
    const [token] = await this.resetTokenModel.aggregate([
      {
        $match: {
          token: resetToken,
          expire_at: { $gt: now() },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          token: 1,
          expire_at: 1,
          user: {
            _id: 1,
            email: 1,
          },
        },
      },
    ]);

    return token;
  }

  /**
   * Finds a reset token document by the associated user ID.
   *
   * @param userId - The user ID to find the reset token for.
   * @returns The reset token document or null if none exists.
   */
  async findByUserId(userId: string) {
    return this.resetTokenModel.findOne({ user_id: userId });
  }

  /**
   * Deletes a reset token document by its token string.
   *
   * @param token - The reset token string to delete.
   * @returns The result of the deletion operation.
   */
  async deleteToken(token: string): Promise<DeleteResult> {
    const deletedToken = await this.resetTokenModel.deleteOne({ token });
    return deletedToken;
  }

  /**
   * Updates the expiration date of a reset token.
   *
   * @param token - The reset token string to update.
   * @param newExpireAt - The new expiration date/time.
   */
  async updateToken(token: string, newExpireAt: Date): Promise<void> {
    await this.resetTokenModel.updateOne(
      { token },
      { $set: { expire_at: newExpireAt } },
    );
  }
}
