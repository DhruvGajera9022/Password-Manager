import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'nicole.kessler@ethereal.email',
        pass: 'z9quHsn7vkAt2MmMwf',
      },
    });
  }

  async sendResetPasswordMail(to: string, token: string) {
    const resetLink = `http://localhost:5001/reset-password?token=${token}`;

    const mailOptions = {
      from: 'Nest Authentication Project',
      to: to,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below th reset your password:<p><a href="${resetLink}">Reset Password</a></p></p><br>
      <p>Note: This link will expire in 15 minutes for security reasons.</p>`,
    };
    await this.transporter.sendMail(mailOptions);
  }
}
