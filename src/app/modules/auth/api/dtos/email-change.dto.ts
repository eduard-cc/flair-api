import {IsEmail, IsNotEmpty, IsString, Length, MaxLength, MinLength} from 'class-validator';

import {Account} from '@modules/user/account.entity';

export class EmailChangeDto {
	@IsNotEmpty()
	@IsEmail()
	@Length(1, 255)
	newEmail: Account['email'];

	@IsNotEmpty()
	@IsString()
	@MinLength(8)
	@MaxLength(255)
	password: Account['password'];
}
