import { Module } from '@nestjs/common';
import { FileParserFactory } from './file-parser.factory';
import { XlsFileParser } from './service/xls-file-parser.service';
import { CsvFileParser } from './service/csv-file-parser.service';
import { FileParserResolver } from './file-parser.resolver';
import { BankTransactionAdapterModule } from 'src/bank-transaction-adapter/bank-transaction-adapter.module';

@Module({
  imports: [BankTransactionAdapterModule],
  providers: [
    XlsFileParser,
    CsvFileParser,
    FileParserFactory,
    FileParserResolver,
  ],
})
export class FileParserModule {}