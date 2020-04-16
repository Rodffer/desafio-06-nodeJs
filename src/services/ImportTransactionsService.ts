import { getCustomRepository, getRepository, getConnection } from 'typeorm';
import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import uploadConfig from '../config/upload';

interface Request {
  fileName: string;
}

interface CsvData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const csvData: CsvData[] = [];

    const parsers = csvParse({ delimiter: ', ', from_line: 2 });
    const csvPath = path.join(uploadConfig.directory, fileName);
    const csvReadStream = fs.createReadStream(csvPath);
    const parseCSV = csvReadStream.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;
      csvData.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categories = csvData
      .map(data => data.category)
      .filter((elem, pos, self) => {
        return self.indexOf(elem) === pos;
      })
      .map(cat => categoryRepository.create({ title: cat }));

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Category)
      .values(categories)
      .execute();

    const transactions = csvData.map(transaction => {
      const category_id = categories.find(
        category => category.title === transaction.category,
      )?.id;

      return transactionsRepository.create({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id,
      });
    });

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Transaction)
      .values(transactions)
      .execute();

    await fs.promises.unlink(csvPath);

    return transactions;
  }
}

export default ImportTransactionsService;
