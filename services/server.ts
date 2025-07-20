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

  console.log(`Found ${newExpenses.length} new expenses to sync`);
  console.log('🔍 Expenses to sync:', newExpenses);

  let syncedCount = 0;
  let failedCount = 0;

  for (const exp of newExpenses) {
    try {
      // More detailed validation
      console.log(`🔍 Processing expense ${exp.id}:`, exp);
      
      if (!exp.id || !exp.category || !exp.amount || !exp.type || !exp.created_at) {
        console.error(`❌ Invalid expense data for ID ${exp.id}:`, exp);
        failedCount++;
        continue;
      }

      if (!email || !email.includes('@')) {
        console.error(`❌ Invalid email: ${email}`);
        failedCount++;
        continue;
      }

      const payload = {
        expense_id: exp.id,
        email: email,
        category: exp.category.toString().trim(),
        amount: parseFloat(exp.amount.toString()),
        type: exp.type,
        description: (exp.description || '').toString(),
        created_at: exp.created_at,
      };

      console.log(`📤 Sending payload for expense ${exp.id}:`, JSON.stringify(payload, null, 2));

      const response = await fetch(`https://${Localhost}/save_expense.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log(`📡 Response status for expense ${exp.id}: ${response.status}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log(`📡 Raw response for expense ${exp.id}:`, responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`❌ Non-JSON response for expense ${exp.id}:`, responseText);
        throw new Error('Server returned non-JSON response');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ JSON parse error for expense ${exp.id}:`, parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log(`📦 Parsed response for expense ${exp.id}:`, result);

      if (result.success === true) {
        await db.runAsync(`UPDATE expenses SET isUploaded = 1 WHERE id = ?`, [exp.id]);
        syncedCount++;
        console.log(`✅ Successfully synced expense ${exp.id}`);
      } else {
        failedCount++;
        const errorMessage = result.message || result.error || 'Unknown server error';
        console.warn(`⚠️ Failed to upload expense ${exp.id}: ${errorMessage}`);
      }

    } catch (error: any) {
      failedCount++;
      console.error(`❌ Error syncing expense ${exp.id}:`, error.message || error);
    }
  }

  console.log(`📊 Sync summary: ${syncedCount} synced, ${failedCount} failed`);
  return { synced: syncedCount, failed: failedCount };
}


// Sync All changes
async function syncExpenseChanges(db: SQLiteDatabase, email: string) {
  const changes = await db.getAllAsync<ExpenseChange>(`
    SELECT * FROM expense_changes WHERE isSynced = 0
  `);

  console.log(`Found ${changes.length} changes to sync`);

  for (const change of changes) {
    try {
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

      const expenses = await db.getAllAsync(
        `SELECT * FROM expenses WHERE id = ?`,
        [change.expense_id]
      );

      if (change.action === 'edited') {
        payload.expenses = expenses;
      } else if (change.action === 'deleted') {
        payload.expenses = [];
      }

      const response = await fetch(`https://${Localhost}/sync_changes.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON');
      }

      const data = await response.json();
      
      if (data.success) {
        await db.runAsync(`UPDATE expense_changes SET isSynced = 1 WHERE id = ?`, [change.id]);
        console.log(`✅ Synced change ${change.id}`);
      } else {
        console.warn(`⚠️ Failed to sync change ${change.id}:`, data.message);
      }
    } catch (error: any) {
      console.error(`❌ Error syncing change ${change.id}:`, error.message);
      continue;
    }
  }

  // Clean up synced changes
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


 
