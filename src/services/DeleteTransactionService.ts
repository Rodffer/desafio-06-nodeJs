import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.find({
      where: { id },
    });

    if (!transaction) {
      throw new AppError('Transaction not found.', 404);
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
