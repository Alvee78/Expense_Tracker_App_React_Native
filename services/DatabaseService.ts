import { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';

export class DatabaseService {
  private db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  async getAllExpenses() {
    return await this.db.getAllAsync(`SELECT * FROM expenses ORDER BY created_at DESC`);
  }

  async addExpense({
    category,
    amount,
    type,
    description,
    isUploaded = 0,
  }: {
    category: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    isUploaded?: number;
  }) {
    await this.db.runAsync(
      `INSERT INTO expenses (category, amount, type, description, isUploaded) VALUES (?, ?, ?, ?, ?)`,
      category,
      amount,
      type,
      description,
      isUploaded
    );
  }

  async getExpensesByType(type: 'income' | 'expense') {
    return await this.db.getAllAsync(`SELECT * FROM expenses WHERE type = ?`, type);
  }

  async getTotalByCategory() {
    return await this.db.getAllAsync(`
      SELECT category, SUM(amount) as total
      FROM expenses
      GROUP BY category
    `);
  }

  async deleteExpense(id: number) {
    return await this.db.runAsync(`DELETE FROM expenses WHERE id = ?`, id);
  }

  async updateExpense(id: number, fields: { [key: string]: any }) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    return await this.db.runAsync(
      `UPDATE expenses SET ${setClause} WHERE id = ?`,
      ...values,
      id
    );
  }
}
