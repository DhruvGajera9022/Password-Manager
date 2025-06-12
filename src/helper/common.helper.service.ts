import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CommonService {
  private algorithm: string;
  private secretKey: Buffer;

  constructor() {
    this.algorithm = 'aes-256-gcm'; // Changed to GCM for better security

    // Validate environment variables
    if (!process.env.ENCRYPTION_SECRET_KEY) {
      throw new Error('ENCRYPTION_SECRET_KEY environment variable is required');
    }

    this.secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex');

    // Validate key length (should be 32 bytes for AES-256)
    if (this.secretKey.length !== 32) {
      throw new Error(
        'ENCRYPTION_SECRET_KEY must be 64 hex characters (32 bytes)',
      );
    }
  }

  /**
   * @description Compare a plain text password with hashed password
   * @param {string} password - The plain text password
   * @param {string} hashedPassword - The hashed password
   * @returns {Promise<boolean>} - if password match resolve true otherwise false
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  /**
   * Hash the plain text password
   * @param {string} password - the plain text password
   * @returns {Promise<string>} - A promise resolve hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 12); // Increased salt rounds
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  /**
   * @param {Number} page this is the current pageNo
   * @param {Number} limit this is the limit of items per page
   * @returns {Array} 0: skip size, 1: limit (fixed return type annotation)
   */
  getLimitAndSkipSize(page: number, limit: number): [number, number] {
    const skip = (page - 1) * limit;
    return [skip, limit]; // Fixed: return skip and limit, not endIndex
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM algorithm.
   * GCM provides both encryption and authentication.
   *
   * @param {string} text - The plain text to encrypt.
   * @returns {string} The encrypted string with IV and auth tag in hex format.
   *
   * @example
   * const encrypted = encrypt('mySecretPassword');
   * console.log(encrypted); // => 'iv:authTag:encryptedData'
   */
  encrypt(text: string): string {
    try {
      // Generate a random IV for each encryption
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get the authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts a hex-encoded string using AES-256-GCM algorithm.
   *
   * @param {string} text - The encrypted string in format 'iv:authTag:encryptedData'.
   * @returns {string} The decrypted plain text.
   *
   * @example
   * const decrypted = decrypt('iv:authTag:encryptedData');
   * console.log(decrypted); // => 'mySecretPassword'
   */
  decrypt(text: string): string {
    try {
      // Split the combined string
      const parts = text.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        iv,
      ) as any;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}
