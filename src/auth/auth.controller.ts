import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, VerifySignupOtpDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login endpoint: only email and password are needed.
  @Post('login')
  async login(@Body() loginDto: AuthDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  // Signup endpoint: first step—user submits email and password.
  @Post('signup')
  async signup(@Body() signupDto: AuthDto) {
    return this.authService.signup(signupDto.email, signupDto.password);
  }

  // Signup OTP verification endpoint: second step—user verifies OTP.
  @Post('signup/verify')
  async verifySignupOtp(@Body() dto: VerifySignupOtpDto) {
    return this.authService.verifySignupOtp(dto.email, dto.otp);
  }
}
