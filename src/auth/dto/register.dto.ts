import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[@$!%*?&]/, {
    message: 'Password must contain at least one special character',
  })
  @Matches(/^.{8,}$/, {
    message: 'Password must be at least 8 characters long',
  })
  password: string;
}
