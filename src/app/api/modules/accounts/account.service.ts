import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';

import {Account} from '@entities/account/account.entity';
import {AccountRepository} from '@entities/account/account.repository';
import {User} from '@entities/user/user.entity';
import {UserService} from '@modules/users/user.service';

import {AccountCreateDto} from './account-create.dto';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly userService: UserService,
  ) {}

  async save(dto: AccountCreateDto, userId: User['id']): Promise<Account> {
    const user = await this.userService.findById(userId);

    if (dto.alias) {
      const aliasExists = await this.accountRepository.existsByUserIdAndAlias(userId, dto.alias);

      if (aliasExists) {
        throw new ConflictException(`Account with alias ${dto.alias} already exists.`);
      }
    }
    return this.accountRepository.save({...dto, user});
  }

  async findAllByUserId(userId: User['id']): Promise<Account[]> {
    return this.accountRepository.findAllByUserId(userId);
  }

  async findById(accountId: Account['id'], userId: User['id']): Promise<Account> {
    const account = await this.accountRepository.findByAccountIdAndUserId(accountId, userId);

    if (!account) {
      throw new NotFoundException(`Account with id ${accountId} not found.`);
    }
    return account;
  }
}
