import {BadRequestException, Injectable} from '@nestjs/common';
import {Inject} from '@nestjs/common';
import Redis from 'ioredis';
import ms from 'ms';

import {ConfigurationService} from '@core/config/config.service';
import {EmailService} from '@core/email/email.service';
import {REDIS} from '@core/redis/redis.constants';
import {User} from '@modules/user/user.entity';
import {UserService} from '@modules/user/user.service';

@Injectable()
export class EmailVerifierService {
  private readonly EXPIRATION: number;
  private readonly REDIS_KEY: string;
  private readonly WEB_BASE_URL: string;

  constructor(
    @Inject(REDIS) private readonly redisClient: Redis,
    private readonly configService: ConfigurationService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {
    this.REDIS_KEY = this.configService.get('EMAIL_VERIFICATION_REDIS_KEY');
    this.WEB_BASE_URL = this.configService.get('WEB_BASE_URL');

    const expirationMs = ms(this.configService.get('EMAIL_VERIFICATION_EXPIRATION'));
    const expirationSeconds = Math.floor(expirationMs / 1000);
    this.EXPIRATION = expirationSeconds;
  }

  async verify(code: string) {
    const email = await this.getEmailByCode(code);

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const verifiedUser = await this.userService.update(user.id, {isEmailVerified: true});
    await this.removeCode(code);
    return verifiedUser;
  }

  async sendWelcomeEmail(user: User) {
    const code = await this.createCode(user.email);
    const verificationUrl = await this.createUrl(code);

    await this.emailService.send({
      to: user.email,
      subject: `Welcome to Flair - ${code} is your verification code`,
      template: 'welcome',
      context: {name: user.name, verificationUrl, code},
    });
  }

  async sendVerifyEmail(user: User) {
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const code = await this.createCode(user.email);
    const verificationUrl = await this.createUrl(code);

    await this.emailService.send({
      to: user.email,
      subject: `${code} is your verification code`,
      template: 'verify-email',
      context: {name: user.name, verificationUrl, code},
    });

    return {message: 'Verification email sent.'};
  }

  async requestEmailChange(user: User, newEmail: User['email']) {
    await this.userService.verifyEmailIsUnique(newEmail);

    const code = await this.createCode(newEmail);
    const verificationUrl = await this.createUrl(code);

    await this.emailService.send({
      to: newEmail,
      subject: `${code} is your verification code`,
      template: 'verify-new-email',
      context: {name: user.name, verificationUrl},
    });
    return {message: 'Verification email sent.'};
  }

  async verifyEmailChange(user: User, code: string) {
    const newEmail = await this.getEmailByCode(code);

    await this.userService.verifyEmailIsUnique(newEmail);
    const updatedUser = await this.userService.update(user.id, {email: newEmail});

    await this.removeCode(code);
    return updatedUser;
  }

  async createUrl(code: string) {
    const url = new URL('/verify', this.WEB_BASE_URL);
    url.search = new URLSearchParams({code}).toString();
    return url.toString();
  }

  async createCode(email: User['email']) {
    while (true) {
      const code = Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('');
      const key = `${this.REDIS_KEY}:${code}`;

      try {
        await this.getEmailByCode(code);
      } catch {
        await this.redisClient.set(key, email, 'EX', this.EXPIRATION);
        return code;
      }
    }
  }

  async getEmailByCode(code: string) {
    const key = `${this.REDIS_KEY}:${code}`;
    const email = await this.redisClient.get(key);

    if (!email) {
      throw new BadRequestException('Invalid or expired verification code.');
    }
    return email;
  }

  async removeCode(code: string) {
    const key = `${this.REDIS_KEY}:${code}`;
    await this.redisClient.del(key);
  }
}
