import {Body, Controller, HttpCode, Post, Req, UseGuards} from '@nestjs/common';
import {ApiResponse} from '@nestjs/swagger';
import {Throttle, hours} from '@nestjs/throttler';
import {Request} from 'express';
import {User} from 'src/app/modules/user/user.entity';

import {UserService} from '@modules/user/user.service';

import {CurrentUser} from '../decorators/current-user.decorator';
import {Public} from '../decorators/public.decorator';
import {LocalLogInGuard} from '../guards/local-login.guard';
import {LogInDto} from './login.dto';
import {SignUpDto} from './signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Throttle({default: {limit: 12, ttl: hours(1)}})
  @Public()
  @UseGuards(LocalLogInGuard)
  @Post('login')
  @HttpCode(200)
  @ApiResponse({status: 200, description: 'User has been successfully logged in.'})
  @ApiResponse({status: 400, description: 'Validation of the request body failed.'})
  @ApiResponse({status: 401, description: 'Invalid credentials.'})
  @ApiResponse({status: 429, description: 'Too many requests. Try again later.'})
  async logIn(@Body() _dto: LogInDto, @CurrentUser() user: User) {
    return user;
  }

  @Throttle({default: {limit: 3, ttl: hours(1)}})
  @Public()
  @Post('signup')
  @ApiResponse({status: 201, description: 'The user has been successfully created.'})
  @ApiResponse({status: 400, description: 'Validation of the request body failed.'})
  @ApiResponse({status: 409, description: 'An account with this email already exists.'})
  @ApiResponse({status: 429, description: 'Too many requests. Try again later.'})
  async signUp(@Body() dto: SignUpDto, @Req() request: Request) {
    const user = await this.userService.save(dto);

    await new Promise<void>((resolve) => {
      request.logIn(user, () => {
        resolve();
      });
    });
    return user;
  }

  @Post('logout')
  @HttpCode(200)
  @ApiResponse({status: 200, description: 'User has been successfully logged out.'})
  @ApiResponse({status: 401, description: 'User is not logged in.'})
  async logOut(@Req() request: Request) {
    await new Promise<void>((resolve) => {
      request.logOut({keepSessionInfo: false}, () => {
        resolve();
      });
      request.session.destroy(() => {
        resolve();
      });
    });
  }
}
