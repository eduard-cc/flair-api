import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statement } from '../entities/statement/statement.entity';
import { AccountService } from '../account/account.service';
import { Transaction } from '../entities/transaction/transaction.entity';
import { FileParserService } from '../file-parser/file-parser.service';
import { TransactionMapperService } from '../transaction-mapper/transaction-mapper.service';
import { TransactionService } from '../transaction/transaction.service';
import { UploadStatementArgs } from './dto/upload-statement.args';

@Injectable()
export class StatementService {
  constructor(
    @InjectRepository(Statement)
    private readonly statementRepository: Repository<Statement>,
    private readonly accountService: AccountService,
    private readonly fileParserService: FileParserService,
    private readonly transactionMapperService: TransactionMapperService,
    private readonly transactionService: TransactionService,
  ) {}

  async processStatement(args: UploadStatementArgs): Promise<Transaction[]> {
    const { file, accountId } = args;
    const account = await this.accountService.findById(accountId);

    const { createReadStream, mimetype } = file;
    const stream = createReadStream();
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const data = this.fileParserService.parse(buffer, mimetype);

    const createTransactionDtos = await this.transactionMapperService.map(
      data,
      account.bank,
    );
    const transactions = await this.transactionService.create(
      createTransactionDtos,
      account,
    );

    // TODO: save statement in db

    return transactions;
  }
}
