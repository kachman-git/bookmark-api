import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as agron from 'argon2';
import * as speakeasy from 'speakeasy';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prima: PrismaService,
    private config: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prima.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await agron.verify(password, user.hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user.id, user.email);
  }

  async signup(email: string, password: string) {
    const existing = await this.prima.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await agron.hash(password);
    const otp = speakeasy.totp({
      secret: this.config.get('OTP_SECRET'),
      encoding: 'base32',
      step: 300,
    });
    const tempData = { hashedPassword, otp };
    await this.redisService.set(
      `signup:${email}`,
      JSON.stringify(tempData),
      300,
    );
    await this.mailService.sendOtp(email, otp);
    return {
      message: 'OTP sent to your email. Please verify to complete signup.',
    };
  }

  async verifySignupOtp(email: string, otp: string) {
    const dataStr = await this.redisService.get(`signup:${email}`);
    if (!dataStr) {
      throw new UnauthorizedException('Signup session expired or not found');
    }
    const data = JSON.parse(dataStr);
    if (data.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    const newUser = await this.prima.user.create({
      data: { email, hash: data.hashedPassword },
    });

    await this.redisService.del(`signup:${email}`);

    return this.generateToken(newUser.id, newUser.email);
  }

  async generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const secreat = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      secret: secreat,
      expiresIn: '15m',
    });

    return { access_token: token };
  }
}
