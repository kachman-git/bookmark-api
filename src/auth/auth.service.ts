import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email is already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hash = await argon.hash(dto.password);

    // Create user with profile
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        provider: 'email',
        profile: {
          create: {
            firstName: dto.name,
          },
        },
      },
    });

    // Generate verification token
    const verificationToken = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '1d',
      },
    );

    // Send verification email
    await this.mailService.sendEmailVerification(
      user.email,
      user.name,
      verificationToken,
    );

    return {
      message: 'Registration successful. Check your email for verification.',
    };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordValid = await argon.verify(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  async handleOAuthLogin(profile: any) {
    // Find or create user
    const user = await this.prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.id,
        },
      },
      update: {
        email: profile.email,
        profile: {
          update: {
            firstName: profile.displayName,
          },
        },
      },
      create: {
        provider: profile.provider,
        providerId: profile.id,
        email: profile.email,
        isVerified: true,
        profile: {
          create: {
            firstName: profile.displayName,
          },
        },
      },
    });

    return this.generateTokens(user);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExp: { gt: new Date() },
      },
    });

    if (!user) throw new NotFoundException('Invalid or expired token');

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExp: null,
      },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const passwordValid = await argon.verify(user.password, password);
    return passwordValid ? user : null;
  }

  async requestAccountDeletion(userId: string, email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deleteAccountToken: token,
        deleteAccountTokenExp: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    await this.mailService.sendDeletionConfirmation(email, token);
    return { message: 'Deletion confirmation email sent' };
  }

  async confirmAccountDeletion(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        deleteAccountToken: token,
        deleteAccountTokenExp: { gt: new Date() },
      },
      include: { profile: true },
    });

    if (!user) throw new NotFoundException('Invalid or expired token');

    // Delete user (cascades to profile and refresh tokens)
    await this.prisma.user.delete({ where: { id: user.id } });

    await this.mailService.sendAccountDeletedConfirmation(
      user.email,
      user.profile?.firstName || 'User',
    );

    return { message: 'Account permanently deleted' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: await argon.hash(refreshToken),
        userId: user.id,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
