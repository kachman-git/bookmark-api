import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendVerificationEmail(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        supportEmail: this.config.get('MAIL_SUPPORT_ADDRESS'),
      },
    });
  }

  async sendDeletionConfirmation(email: string, token: string) {
    const url = `${this.config.get('auth.frontendUrl')}/confirm-deletion?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Confirm Account Deletion',
      template: 'account-deletion',
      context: {
        url,
        hoursValid: 1,
      },
    });
  }

  async sendAccountDeletedConfirmation(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Account Successfully Deleted',
      template: 'account-deleted',
      context: {
        name,
        supportEmail: this.config.get('MAIL_SUPPORT_ADDRESS'),
      },
    });
  }
}
