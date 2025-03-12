import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class AuthDto {
  @IsEmail()
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, {
    message: 'Password is too short. It should be at least 8 characters long.',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least one special character',
  })
  password: string;
}

export class VerifySignupOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;
}
