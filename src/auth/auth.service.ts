import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('Email already registered');

    const hashedPassword = await argon.hash(dto.password);
    const otp = this.generateOTP();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        otp,
        otpExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    await this.mailService.sendVerificationEmail(user.email, otp);
    return { message: 'OTP sent to email' };
  }

  async verifyOtp(otp: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        otp,
      },
    });

    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otp: null,
        otpExpiry: null,
        isVerified: true,
      },
    });
    return { message: 'Account verified. Please sign in' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const hash = await argon.verify(user.password, dto.password);

    if (!user || !user.isVerified || !hash)
      throw new UnauthorizedException('Invalid credentials');
    return await this.generateTokens(user.id, user.email);
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const valid = await argon.verify(user.refreshToken, refreshToken);
    if (!valid) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.email);
  }

  private async generateTokens(id: number, email: string) {
    const payload = { sub: id, email: email };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_ACCESS_SECRET'),
    });

    const refreshToken = this.jwt.sign(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    const hashToken = await argon.hash(refreshToken);
    await this.prisma.user.update({ where: { id }, data: { refreshToken } });

    return { accessToken, refreshToken };
  }

  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
