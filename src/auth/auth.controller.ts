import { Controller, Post, Body, Get, UseGuards, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorator/get-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('github')
  async githubAuth() {
    // Redirect handled by passport
  }

  @Get('github/callback')
  async githubCallback(@GetUser() user: any) {
    return this.authService.handleOAuthLogin(user);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('request-deletion')
  @UseGuards(JwtAuthGuard)
  async requestAccountDeletion(
    @GetUser('id') userId: string,
    @GetUser('email') email: string,
  ) {
    return this.authService.requestAccountDeletion(userId, email);
  }

  @Post('confirm-deletion')
  async confirmAccountDeletion(@Body('token') token: string) {
    return this.authService.confirmAccountDeletion(token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: any) {
    return user;
  }
}
