import { Args, Query, Resolver } from '@nestjs/graphql';
import { Account } from './models/account.model';
import { AccountService } from './account.service';
import { CreateAccountArgs } from './dto/create-account.args';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Resolver(() => Account)
export class AccountResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => Account)
  create(
    @Args() createAccountArgs: CreateAccountArgs,
    @CurrentUser() user: User,
  ): Promise<Account> {
    const account = this.accountService.create(createAccountArgs, user.id);
    return account;
  }
}