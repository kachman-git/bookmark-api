import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('auth.googleClientId'),
      clientSecret: config.get('auth.googleClientSecret'),
      callbackURL: `${config.get('auth.backendUrl')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user: any) => void,
  ) {
    const { emails, displayName, photos, id } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: displayName,
      avatar: photos?.[0]?.value,
      provider: 'google',
      providerId: id,
      accessToken,
    };
    done(null, user);
  }
}
