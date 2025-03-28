import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Request } from 'express';

interface CustomRequest extends Request {
  user: {
    sub: number;
    refreshToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() { otp }: { otp: string }) {
    return this.authService.verifyOtp(otp);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(@Req() req: CustomRequest) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
  }
}
