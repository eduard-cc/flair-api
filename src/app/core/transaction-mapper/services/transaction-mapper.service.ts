import {BadRequestException, Injectable} from '@nestjs/common';
import {validate} from 'class-validator';

import {Transaction} from '@entities/transaction/transaction.entity';

import {Bank} from '../constants/bank.enum';
import {TransactionMapperFactory} from './transaction-mapper.factory';

@Injectable()
export class TransactionMapperService {
  constructor(private readonly transactionMapperFactory: TransactionMapperFactory) {}

  async map(data: Record<string, string>[], bank: Bank): Promise<Transaction[]> {
    const mapper = this.transactionMapperFactory.create(bank);

    const transactions = await Promise.all(
      data.map(async (rawTransaction) => {
        const transaction = mapper.map(rawTransaction);

        const validationErrors = await validate(transaction);

        if (validationErrors.length > 0) {
          throw new BadRequestException(
            'Validation failed for a transaction: ' + validationErrors.toString(),
          );
        }
        return transaction;
      }),
    );
    return transactions;
  }
}