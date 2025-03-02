import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiResponse} from '@nestjs/swagger';
import {Response} from 'express';

import {CurrentUser} from '@core/auth/decorators/current-user.decorator';
import {Account} from '@modules/account/account.entity';
import {PaginationDto} from '@modules/bank-statement/api/pagination.dto';
import {User} from '@modules/user/user.entity';

import {BankStatement} from '../bank-statement.entity';
import {BankStatementService} from '../bank-statement.service';

// TODO: REMOVE :accountId FROM PATH
@Controller('accounts/:accountId/bank-statements')
export class BankStatementController {
  constructor(private readonly bankStatementService: BankStatementService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Post('login')
  @HttpCode(200)
  @ApiResponse({status: 200, description: 'Bank statement has been successfully created.'})
  @ApiResponse({status: 400, description: 'Validation of the request body failed.'})
  @ApiResponse({status: 401, description: 'Invalid credentials.'})
  @ApiResponse({status: 409, description: 'A bank statement already exists for this period.'})
  @ApiResponse({status: 422, description: 'File is not a valid bank statement.'})
  async upload(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Param('accountId', new ParseUUIDPipe({version: '4'})) accountId: Account['id'],
  ): Promise<BankStatement> {
    return this.bankStatementService.save(file, accountId, user.id);
  }

  @Get()
  async getAllByAccountIdAndUserId(
    @CurrentUser() user: User,
    @Param('accountId', new ParseUUIDPipe({version: '4'})) accountId: Account['id'],
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    bankStatements: BankStatement[];
    total: number;
  }> {
    return this.bankStatementService.findAllByAccountIdAndUserId(accountId, user.id, paginationDto);
  }

  @Delete(':bankStatementId')
  async deleteById(
    @CurrentUser() user: User,
    @Param('bankStatementId', new ParseUUIDPipe({version: '4'}))
    bankStatementId: BankStatement['id'],
  ): Promise<void> {
    return this.bankStatementService.deleteByIdAndUserId(bankStatementId, user.id);
  }

  @Get(':bankStatementId/file')
  async getFile(
    @CurrentUser() user: User,
    @Param('bankStatementId', new ParseUUIDPipe({version: '4'}))
    bankStatementId: BankStatement['id'],
    @Res({passthrough: true}) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.bankStatementService.findFileByIdAndUserId(bankStatementId, user.id);

    res.set({
      'Content-Type': file.type,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Content-Disposition': `attachment; filename="${file.name}"`,
      'Content-Length': file.size.toString(),
      'X-File-Id': file.id,
    });
    return new StreamableFile(file.buffer);
  }
}
