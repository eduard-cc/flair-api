import { Injectable } from '@nestjs/common';
import { AbnAmroTransactionMapper } from './impl/abnamro-transaction-mapper';
import { RevolutTransactionMapper } from './impl/revolut-transaction-mapper';
import { TransactionMapper } from './transaction-mapper.abstract';
import { Bank } from './models/bank.enum';

@Injectable()
export class TransactionMapperFactory {
  constructor(
    private readonly abnAmroMapper: AbnAmroTransactionMapper,
    private readonly revolutMapper: RevolutTransactionMapper,
  ) {}

  create(bank: Bank): TransactionMapper {
    switch (bank) {
      case Bank.ABN_AMRO:
        return this.abnAmroMapper;
      case Bank.REVOLUT:
        return this.revolutMapper;
      default:
        throw new Error(`Unsupported bank: ${bank}`);
    }
  }
}
