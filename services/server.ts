  import type { SQLiteDatabase } from 'expo-sqlite'; // adjust import if needed
import { Localhost } from "./MagicWord";
export type Expense = {
  id: number;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  isUploaded: number;
  created_at: string;
};

export type ExpenseChange = {
  id: number;
  action: 'edited' | 'deleted';
  expense_id: number;
  isSynced: number;
};
  // handle user data upload
  export async function saveUser(user_name: string, email: string) {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://${Localhost}/save_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name, email }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to save user');
      console.log('User saved:', json.message);
    } catch (err: any) {
      console.warn('Error saving user:', err.message);
    }
  }


export async function syncNewExpenses(db: SQLiteDatabase, email: string) {
  const newExpenses = await db.getAllAsync<Expense>(`
    SELECT * FROM expenses WHERE isUploaded = 0
  `);

  for (const exp of newExpenses) {
    // Prepare payload with expense fields + email (overriding exp.email)
    const payload = {
      expense_id: exp.id,
      email: email,
      category: exp.category,
      amount: exp.amount,
      type: exp.type,
      description: exp.description,
      created_at: exp.created_at,
    };

    const response = await fetch(`http://${Localhost}/save_expense.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    //---DEBUG---
    // const text = await response.text();
    // console.log('Raw response body:', text);

    const result = await response.json();

    if (result.success) {
      // Mark as uploaded locally
      await db.runAsync(`UPDATE expenses SET isUploaded = 1 WHERE id = ?`, [exp.id]);
    } else {
      console.warn('Failed to upload expense:', result.message);
    }
  }
}


// Sync All changes
async function syncExpenseChanges(db: SQLiteDatabase , email: string) {
  const changes = await db.getAllAsync<ExpenseChange>(`
    SELECT * FROM expense_changes WHERE isSynced = 0
  `);

  for (const change of changes) {
    let payload: {
    action: 'edited' | 'deleted';
    expense_id: number;
    email: string;
    expenses?: any[]; 
    } = {
      action: change.action,
      expense_id: change.expense_id,
      email: email
    };

    // Fetch all related expense rows with this expense_id
    const expenses = await db.getAllAsync(
      `SELECT * FROM expenses WHERE id = ?`,
      [change.expense_id]
    );

    // For 'edited', send all related expense data (array)
    if (change.action === 'edited') {
      payload.expenses = expenses; // array with all matching expenses
    }

    // For 'deleted', usually no need to send full data, just id is enough
    if (change.action === 'deleted') {
      payload.expenses = []; // or omit if your server doesn't need it
    }

    const response = await fetch(`http://${Localhost}/sync_changes.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.success) {
      await db.runAsync(`UPDATE expense_changes SET isSynced = 1 WHERE id = ?`, [change.id]);
    }
  }

  await db.runAsync(`DELETE FROM expense_changes WHERE isSynced = 1`);
}


// Sync All
export async function syncAll(db: SQLiteDatabase, email: string) {
  try {
    await syncNewExpenses(db, email);
     await syncExpenseChanges(db, email);
console.log("Expense table:", await db.getAllAsync("SELECT * FROM expenses"));
console.log("Expense Changes table:", await db.getAllAsync("SELECT * FROM expense_changes"));
    console.log('Sync completed successfully');
  } catch (err: any) {
    console.error('Sync failed:', err.message);
  }
}


 
