import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('auth.githubClientId'),
      clientSecret: config.get('auth.githubClientSecret'),
      callbackURL: `${config.get('auth.backendUrl')}/auth/github/callback`,
      scope: ['user:email'],
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
      provider: 'github',
      providerId: id,
      accessToken,
    };
    done(null, user);
  }
}
