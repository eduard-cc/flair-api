import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Account} from '@modules/account/account.entity';

import {DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE} from './api/transaction-query-pagination.dto';
import {TransactionQueryDto} from './api/transaction-query.dto';
import {TransactionUpdateDto} from './api/transaction-update.dto';
import {Transaction} from './transaction.entity';

@Injectable()
export class TransactionService {
	constructor(
		@InjectRepository(Transaction)
		private readonly transactionRepository: Repository<Transaction>,
	) {}

	async findById(accountId: Account['id'], id: Transaction['id']) {
		const transaction = await this.transactionRepository.findOne({
			where: {id, bankAccount: {account: {id: accountId}}},
			relations: ['bankAccount'],
		});

		if (!transaction) {
			throw new NotFoundException(`Transaction not found.`);
		}
		return transaction;
	}

	async findAllByAccountId(accountId: Account['id'], queryParams: TransactionQueryDto) {
		const pagination = queryParams.pagination || {
			pageIndex: DEFAULT_PAGE_INDEX,
			pageSize: DEFAULT_PAGE_SIZE,
		};
		const query = this.transactionRepository
			.createQueryBuilder('transaction')
			.innerJoin('transaction.bankAccount', 'bankAccount')
			.innerJoin('bankAccount.account', 'account')
			.where('account.id = :accountId', {accountId})
			.skip(pagination.pageIndex * pagination.pageSize)
			.take(pagination.pageSize);

		const sort = queryParams.sort;
		if (sort) {
			query.orderBy(`transaction.${sort.by}`, sort.order);
		}

		const filter = queryParams.filter || {};
		if (filter.categories && filter.categories.length > 0) {
			query.andWhere('transaction.category IN (:...categories)', {categories: filter.categories});
		}
		if (filter.startedAt) {
			const from = new Date(filter.startedAt.from);
			const to = new Date(filter.startedAt.to ?? from);
			query.andWhere('transaction.startedAt BETWEEN :from AND :to', {from, to});
		}

		if (filter.banks && filter.banks.length > 0) {
			query.andWhere('bankAccount.bank IN (:...banks)', {banks: filter.banks});
		}

		const [transactions, total] = await query.getManyAndCount();
		return {transactions, total};
	}

	async saveAll(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) {
		if (transactions.length === 0) {
			return Promise.resolve([]);
		}
		return this.transactionRepository.save(transactions);
	}

	async deleteByIds(ids: Transaction['id'][]) {
		return this.transactionRepository.delete(ids);
	}

	async update(accountId: Account['id'], id: Transaction['id'], dto: TransactionUpdateDto) {
		const transaction = await this.findById(accountId, id);

		const updates: Partial<Transaction> = {};
		if (dto.category) {
			updates.category = dto.category;
		}

		await this.transactionRepository.update({id: transaction.id}, updates);
		return this.transactionRepository.findBy({id: transaction.id});
	}
}
