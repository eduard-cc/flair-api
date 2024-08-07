import {faker} from '@faker-js/faker';
import {Test, TestingModule} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Category} from '@core/transaction-categorizer/constants/category.enum';
import {Account} from '@entities/account/account.entity';

import {Transaction} from './transaction.entity';
import {TransactionRepository, TransactionSaveOptions} from './transaction.repository';

function createTransaction(): TransactionSaveOptions {
  return {
    startedDate: faker.date.past(),
    completedDate: faker.date.past(),
    description: faker.finance.transactionDescription(),
    amount: parseFloat(faker.finance.amount()),
    currency: faker.finance.currencyCode(),
    account: {id: faker.string.uuid()} as Account,
    category: faker.helpers.arrayElement(Object.values(Category)),
  };
}

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let mockRepository: Partial<Repository<Transaction>>;

  beforeEach(async () => {
    faker.seed(2);
    mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
      ],
    }).compile();

    transactionRepository = module.get<TransactionRepository>(TransactionRepository);
  });

  it('should be defined', () => {
    expect(transactionRepository).toBeDefined();
  });

  describe('findById', () => {
    it('should find a transaction by id', async () => {
      const id = faker.string.uuid();
      const transaction = {id};
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(transaction);

      const foundTransaction = await transactionRepository.findById(id);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({id});
      expect(foundTransaction).toEqual(transaction);
    });

    it('should return null if transaction is not found by id', async () => {
      const id = faker.string.uuid();
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const foundTransaction = await transactionRepository.findById(id);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({id});
      expect(foundTransaction).toBeNull();
    });
  });

  describe('saveAll', () => {
    it('should save an array of transactions', async () => {
      const transactionsToSave = [createTransaction(), createTransaction()];
      (mockRepository.save as jest.Mock).mockResolvedValue(transactionsToSave);

      const savedTransactions = await transactionRepository.saveAll(transactionsToSave);
      expect(mockRepository.save).toHaveBeenCalledWith(transactionsToSave);
      expect(savedTransactions).toEqual(transactionsToSave);
    });
  });
});
