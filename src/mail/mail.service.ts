import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

@Injectable()
export class MailService {
  private mg;

  constructor() {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY, // Your Mailgun API Key
    });
  }

  async sendOTP(email: string, otp: string) {
    return this.mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `YourApp <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    });
  }
}
