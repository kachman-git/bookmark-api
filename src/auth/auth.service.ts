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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { randomBytes } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await argon.verify(user.refreshToken, refreshToken);
    if (!valid) throw new UnauthorizedException({ message: 'Invalid token' });

    return this.generateTokens(user.id, user.email);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user)
      throw new UnauthorizedException(
        'Invalid Email, Check the email and try again',
      );

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = await argon.hash(resetToken);
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: resetExpires,
      },
    });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user.id}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'Link sent to email, Click the link to reset password' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { id: dto.id } });

    if (!user || user.passwordResetExpires < new Date())
      throw new BadRequestException('Invalid user or expired token');

    // Update password
    const verifyHash = await argon.verify(user.passwordResetToken, dto.token);

    if (!verifyHash) throw new BadRequestException('Invalid token');

    const newHash = await argon.hash(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    return { massage: 'Password has been sucessfully reset' };
  }

  private async generateTokens(id: number, email: string) {
    const payload = { sub: id, email: email };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    const hashToken = await argon.hash(refreshToken);
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: hashToken },
    });

    return { accessToken, refreshToken };
  }

  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
