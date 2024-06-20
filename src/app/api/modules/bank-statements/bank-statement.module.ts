import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {BankStatement} from '@entities/bank-statement/bank-statement.entity';
import {FileParserModule} from '@core/file-parser/file-parser.module';
import {TransactionMapperModule} from '@core/transaction-mapper/transaction-mapper.module';
import {TransactionModule} from '../transactions/transaction.module';
import {AccountModule} from '../accounts/account.module';
import {BankStatementService} from './services/bank-statement.service';
import {BankStatementMutationsResolver} from './graphql/bank-statement.mutations.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankStatement]),
    AccountModule,
    FileParserModule,
    TransactionMapperModule,
    TransactionModule,
  ],
  providers: [BankStatementService, BankStatementMutationsResolver],
})
export class BankStatementModule {}
