import {IsEmail, IsNotEmpty, IsString, Length} from 'class-validator';

import {AuthMethod} from '@modules/auth-method/auth-method.entity';
import {User} from '@modules/user/user.entity';

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: User['name'];

  @IsNotEmpty()
  @IsEmail()
  @Length(1, 255)
  email: User['email'];

  @IsNotEmpty()
  @IsString()
  @Length(8, 255)
  password: NonNullable<AuthMethod['password']>;
}
