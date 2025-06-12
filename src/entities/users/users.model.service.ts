import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.entity';
import { Model, UpdateResult } from 'mongoose';
import { UserRegisterDto } from '@app/auth/dto';

@Injectable()
export class UserModelService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * Creates a new user in the database.
   *
   * @param {UserRegisterDto} registerData - Data submitted during user registration.
   * @param {string} hashedPassword - The securely hashed password.
   * @returns {User} The created user document or null if creation fails.
   */
  async createUser(
    registerData: UserRegisterDto,
    hashedPassword: string,
  ): Promise<User | null> {
    return this.userModel.insertOne({
      name: registerData.name,
      email: registerData.email,
      password: hashedPassword,
    });
  }

  /**
   * Finds a user by their email address.
   *
   * @param {string} email - The email of the user to find.
   * @returns {User} The user document without the 'tickets' field or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  /**
   * Updates a user's password.
   *
   * @param {string} user_id - The user's MongoDB `_id`.
   * @param {string} password - The new hashed password to set.
   * @returns {UpdateResult} The result of the update operation or null if it fails.
   */
  async updatePassword(
    user_id: string,
    password: string,
  ): Promise<UpdateResult | null> {
    const updatedPassword = await this.userModel.updateOne(
      { _id: user_id },
      { $set: { password } },
    );

    return updatedPassword;
  }
}
