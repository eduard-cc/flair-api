import {UnprocessableEntityException} from '@nestjs/common';
import Joi from 'joi';

import {amountPattern} from '@core/transaction-mapper/constants/amount.regex';

import {TransactionMapper, TransactionPartial} from '../transaction-mapper.interface';

export type AbnAmroTransaction = {
  accountNumber: string;
  mutationcode: string;
  transactiondate: string;
  valuedate: string;
  startsaldo: string;
  endsaldo: string;
  amount: string;
  description: string;
};

const abnAmroTransactionSchema = Joi.object({
  accountNumber: Joi.optional(),
  mutationcode: Joi.string().required(),
  transactiondate: Joi.string().length(8).required(),
  valuedate: Joi.string().length(8).required(),
  startsaldo: Joi.optional(),
  endsaldo: Joi.optional(),
  amount: Joi.string().pattern(amountPattern).required(),
  description: Joi.string().required(),
});

export class AbnAmroTransactionMapper implements TransactionMapper {
  map(transaction: AbnAmroTransaction): TransactionPartial {
    const {error} = abnAmroTransactionSchema.validate(transaction);
    if (error) {
      throw new UnprocessableEntityException('File is not a valid ABN AMRO bank statement.');
    }

    return {
      startedAt: this.parseDate(transaction.transactiondate),
      completedAt: this.parseDate(transaction.valuedate),
      description: transaction.description.replace(/\s+/g, ' ').trim(),
      amount: parseFloat(transaction.amount),
      currency: transaction.mutationcode,
    };
  }

  private parseDate(dateString: string): Date {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));

    const date = new Date(year, month, day);

    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      throw new UnprocessableEntityException('File is not a valid ABN AMRO bank statement.');
    }
    return date;
  }
}
