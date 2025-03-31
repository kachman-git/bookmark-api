import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';

@Injectable()
export class MailService {
  private readonly client: postmark.ServerClient;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new postmark.ServerClient(
      this.config.get<string>('POSTMARK_API_KEY'),
    );
  }

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    try {
      await this.client.sendEmailWithTemplate({
        From: this.config.get<string>('MAIL_SENDER'),
        To: email,
        TemplateId: parseInt(
          this.config.get<string>('POSTMARK_OTP_TEMPLATE_ID'),
        ),
        TemplateModel: {
          otp,
          supportEmail: this.config.get<string>('MAIL_SUPPORT_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`OTP email sent to ${email} using template`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      await this.client.sendEmailWithTemplate({
        From: this.config.get<string>('MAIL_SENDER'),
        To: email,
        TemplateId: parseInt(
          this.config.get<string>('POSTMARK_PASSWORD_RESET_TEMPLATE_ID'),
        ),
        TemplateModel: {
          resetUrl,
          supportEmail: this.config.get<string>('MAIL_SUPPORT_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Password reset email sent to ${email} using template`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
