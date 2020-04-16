import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionList = await this.find();

    const income = transactionList
      .filter(transaction => transaction.type === 'income')
      .reduce((accumulate, transaction) => {
        return accumulate + transaction.value;
      }, 0);

    const outcome = transactionList
      .filter(transaction => transaction.type === 'outcome')
      .reduce((accumulate, transaction) => {
        return accumulate + transaction.value;
      }, 0);

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
