import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

@Injectable()
export class MailService {
  private mg;
  private config: ConfigService;
  constructor(config: ConfigService) {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: config.get('MAILGUN_API_KEY'), // Your Mailgun API Key
    });
  }

  async sendOTP(email: string, otp: string) {
    return this.mg.messages.create(this.config.get('MAILGUN_DOMAIN'), {
      from: `YourApp <noreply@${this.config.get('MAILGUN_DOMAIN')}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    });
  }
}
