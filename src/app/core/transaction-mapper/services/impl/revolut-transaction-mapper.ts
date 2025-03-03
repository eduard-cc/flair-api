import {UnprocessableEntityException} from '@nestjs/common';
import Joi from 'joi';

import {amountPattern} from '@core/transaction-mapper/constants/amount.regex';

import {TransactionMapper, TransactionPartial} from '../transaction-mapper.interface';

export type RevolutTransaction = {
  type: string;
  product: string;
  startedDate: string;
  completedDate: string;
  description: string;
  amount: string;
  fee: string;
  currency: string;
  state: string;
  balance: string;
};

const revolutTransactionSchema = Joi.object({
  type: Joi.optional(),
  product: Joi.optional(),
  startedDate: Joi.string().isoDate().required(),
  completedDate: Joi.string().isoDate().required(),
  description: Joi.string().required(),
  amount: Joi.string().pattern(amountPattern).required(),
  fee: Joi.optional(),
  currency: Joi.string().required(),
  state: Joi.optional(),
  balance: Joi.optional(),
});

export class RevolutTransactionMapper implements TransactionMapper {
  map(transaction: RevolutTransaction): TransactionPartial {
    const {error} = revolutTransactionSchema.validate(transaction);
    if (error) {
      throw new UnprocessableEntityException('File is not a valid Revolut bank statement.');
    }

    return {
      startedAt: new Date(transaction.startedDate),
      completedAt: new Date(transaction.completedDate),
      description: transaction.description.replace(/\s+/g, ' ').trim(),
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
    };
  }
}
