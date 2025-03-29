import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        year: new Date().getFullYear(),
        otp,
        supportEmail: this.config.get('MAIL_SUPPORT_ADDRESS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: 'reset-password',
      context: {
        resetUrl,
        year: new Date().getFullYear(),
      },
    });
  }
}
