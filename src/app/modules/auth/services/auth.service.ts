import {Injectable} from '@nestjs/common';
import argon2 from 'argon2';
import {Request} from 'express';

import {AuthMethodService} from '@modules/auth-method/auth-method.service';
import {User} from '@modules/user/user.entity';
import {UserService} from '@modules/user/user.service';

import {ChangePasswordDto} from '../api/dtos/change-password.dto';
import {SignUpDto} from '../api/dtos/signup.dto';
import {EmailVerifierService} from './email-verifier.service';
import {SessionService} from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly emailVerifierService: EmailVerifierService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly authMethodService: AuthMethodService,
  ) {}

  async signUp({name, email, password}: SignUpDto, request: Request) {
    await this.userService.validateEmailIsUnique(email);

    const user = await this.userService.save(name, email, false);
    await this.authMethodService.createLocalMethod(user.id, password);

    await this.emailVerifierService.sendWelcomeEmail(user);
    await this.logIn(user, request);
    return user;
  }

  async logOut(request: Request) {
    await new Promise<void>((resolve) => {
      request.logOut({keepSessionInfo: false}, () => {
        resolve();
      });
      request.session.destroy(() => {
        resolve();
      });
    });
    return {message: 'User logged out.'};
  }

  async logIn(user: User, request: Request) {
    await new Promise<void>((resolve) => {
      request.logIn(user, () => {
        resolve();
      });
    });
    await this.sessionService.initializeSessionMetadata(request);
    return {message: 'User logged in.'};
  }

  async changePassword(user: User, dto: ChangePasswordDto) {
    await this.authMethodService.verifyLocalPassword(user.id, dto.currentPassword);

    const hash = await argon2.hash(dto.newPassword);
    await this.authMethodService.updatePassword(user.id, hash);
    return {message: 'Password changed.'};
  }
}
