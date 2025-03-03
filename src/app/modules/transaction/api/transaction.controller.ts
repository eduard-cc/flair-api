import {Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query} from '@nestjs/common';

import {CurrentUser} from '@core/auth/decorators/current-user.decorator';
import {User} from '@modules/user/user.entity';

import {Transaction} from '../transaction.entity';
import {TransactionService} from '../transaction.service';
import {TransactionPatchDto} from './transaction.patch.dto';
import {TransactionQueryDto} from './transaction.query.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() queryParams: TransactionQueryDto) {
    return this.transactionService.findAllByUserId(user.id, queryParams);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe({version: '4'})) id: Transaction['id'],
  ) {
    return this.transactionService.findById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe({version: '4'})) id: Transaction['id'],
    @Body() patchDto: TransactionPatchDto,
  ) {
    return this.transactionService.update(user.id, id, patchDto);
  }
}
