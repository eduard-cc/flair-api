import {Module} from '@nestjs/common';

import {FileParserModule} from '@core/file-parser/file-parser.module';
import {TransactionMapperModule} from '@core/transaction-mapper/transaction-mapper.module';
import {BankStatementRepositoryModule} from '@entities/bank-statement/bank-statement.repository.module';

import {AccountModule} from '../accounts/account.module';
import {TransactionModule} from '../transactions/transaction.module';
import {BankStatementMutationsResolver} from './graphql/bank-statement.mutations.resolver';
import {BankStatementService} from './services/bank-statement.service';

@Module({
  imports: [
    BankStatementRepositoryModule,
    AccountModule,
    FileParserModule,
    TransactionMapperModule,
    TransactionModule,
  ],
  providers: [BankStatementService, BankStatementMutationsResolver],
})
export class BankStatementModule {}
