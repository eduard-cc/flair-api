import {Controller, Get} from '@nestjs/common';

import {CurrentUser} from '@core/auth/decorators/current-user.decorator';

import {User} from '../user.entity';
import {UserService} from '../user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  findOne(@CurrentUser() user: User): Promise<User> {
    return this.userService.findById(user.id);
  }
}
