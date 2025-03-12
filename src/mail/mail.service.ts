// mail.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor(private config: ConfigService) {
    sgMail.setApiKey(this.config.get('SENDGRID_API_KEY'));
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const msg = {
      to: email,
      from: this.config.get('EMAIL_FROM'), // Must be a verified sender
      subject: 'Your Signup OTP Code',
      text: `Your OTP code is: ${otp}. It is valid for 5 minutes.`,
    };
    await sgMail.send(msg);
  }
}
