import {Exclude, Expose, Type} from 'class-transformer';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {Account} from '@modules/account/account.entity';
import {File} from '@modules/file/file.entity';
import {Transaction} from '@modules/transaction/transaction.entity';

@Entity()
export class BankStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => File)
  @JoinColumn()
  @Expose()
  file: File;

  @OneToMany(() => Transaction, (transaction) => transaction.bankStatement)
  @Expose()
  @Type(() => Transaction)
  transactions: Transaction[];

  @ManyToOne(() => Account, (account) => account.bankStatements)
  @Exclude()
  @Type(() => Account)
  account: Account;

  @Expose()
  get period(): {start: Date; end: Date} {
    let start = this.transactions[0].startedAt;
    let end = this.transactions[0].startedAt;

    this.transactions.forEach((transaction) => {
      if (transaction.startedAt < start) {
        start = transaction.startedAt;
      }
      if (transaction.startedAt > end) {
        end = transaction.startedAt;
      }
    });

    return {start, end};
  }

  @CreateDateColumn({type: 'timestamp'})
  @Expose()
  uploadedAt: Date;
}
