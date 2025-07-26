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
export type Budget = {
  id: number;
  category: string;
  amount: number;
  budget_month: number;
  budget_year: number;
  created_at: string;
  isSynced: number;
};
export type BudgetChange = {
  id: number;
  budget_id: number;
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

// NEW: Sync unsynced budgets
export async function syncNewBudgets(db: SQLiteDatabase, email: string) {
  const newBudgets = await db.getAllAsync<Budget>(`
    SELECT * FROM budget WHERE isSynced = 0
  `);

  console.log(`📊 Found ${newBudgets.length} new budgets to sync`);

  let syncedCount = 0;
  let failedCount = 0;

  for (const budget of newBudgets) {
    try {
      console.log(`🔍 Processing budget ${budget.id}:`, budget);
      
      // Validate budget data
      if (!budget.id || !budget.category || !budget.amount || !budget.budget_month || !budget.budget_year) {
        console.error(`❌ Invalid budget data for ID ${budget.id}:`, budget);
        failedCount++;
        continue;
      }

      if (!email || !email.includes('@')) {
        console.error(`❌ Invalid email: ${email}`);
        failedCount++;
        continue;
      }

      // Validate month and year ranges
      if (budget.budget_month < 1 || budget.budget_month > 12) {
        console.error(`❌ Invalid month ${budget.budget_month} for budget ${budget.id}`);
        failedCount++;
        continue;
      }

      if (budget.budget_year < 2020 || budget.budget_year > 2050) {
        console.error(`❌ Invalid year ${budget.budget_year} for budget ${budget.id}`);
        failedCount++;
        continue;
      }

      const payload = {
        budget_id: budget.id,
        email: email,
        category: budget.category.toString().trim(),
        amount: parseFloat(budget.amount.toString()),
        budget_month: parseInt(budget.budget_month.toString()),
        budget_year: parseInt(budget.budget_year.toString()),
        created_at: budget.created_at,
      };

      console.log(`📤 Sending budget payload for ${budget.id}:`, JSON.stringify(payload, null, 2));

      const response = await fetch(`https://${Localhost}/save_budget.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log(`📡 Budget response status for ${budget.id}: ${response.status}`);

      const responseText = await response.text();
      console.log(`📡 Raw budget response for ${budget.id}:`, responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`❌ Non-JSON budget response for ${budget.id}:`, responseText);
        throw new Error('Server returned non-JSON response');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ JSON parse error for budget ${budget.id}:`, parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log(`📦 Parsed budget response for ${budget.id}:`, result);

      if (result.success === true) {
        await db.runAsync(`UPDATE budget SET isSynced = 1 WHERE id = ?`, [budget.id]);
        syncedCount++;
        console.log(`✅ Successfully synced budget ${budget.id}`);
      } else {
        failedCount++;
        const errorMessage = result.message || result.error || 'Unknown server error';
        console.warn(`⚠️ Failed to upload budget ${budget.id}: ${errorMessage}`);
      }

    } catch (error: any) {
      failedCount++;
      console.error(`❌ Error syncing budget ${budget.id}:`, error.message || error);
    }
  }

  console.log(`📊 Budget sync summary: ${syncedCount} synced, ${failedCount} failed`);
  return { synced: syncedCount, failed: failedCount };
}
// Update when budget changes
export async function markBudgetForSync(db: SQLiteDatabase, budgetId: number) {
  try {
    await db.runAsync(`UPDATE budget SET isSynced = 0 WHERE id = ?`, [budgetId]);
    console.log(`📝 Marked budget ${budgetId} for sync`);
  } catch (error: any) {
    console.error(`❌ Error marking budget ${budgetId} for sync:`, error.message);
  }
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
//Sync Deleted Budgets
export async function syncDeletedBudgets(db: SQLiteDatabase, email: string) {
  const deletedBudgets = await db.getAllAsync<BudgetChange>(
    'SELECT * FROM budget_changes WHERE isSynced = 0'
  );
  
  for (const item of deletedBudgets) {
    // Send to server to delete from MySQL
    const response = await fetch(`https://${Localhost}/delete_budget.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        budget_id: item.budget_id, 
        email: email 
      })
    });
    
    if (response.ok) {
      await db.runAsync(
        'UPDATE budget_changes SET isSynced = 1 WHERE id = ?', 
        [item.id]
      );
    }
  }
  // Clear all synced budget changes
  try {
    await db.runAsync('DELETE FROM budget_changes WHERE isSynced = 1');
    console.log('✅ Cleaned up synced budget changes');
  } catch (error: any) {
    console.error('❌ Error cleaning up budget changes:', error.message);
  }
}

//Track Budget Deletion:
export async function trackBudgetDeletion(db: SQLiteDatabase, budgetId: number) {
  try {
    // Check if budget was already synced to server
    const budget = await db.getFirstAsync<{ isSynced: number }>(
      'SELECT isSynced FROM budget WHERE id = ?',
      [budgetId]
    );
    
    if (budget && budget.isSynced === 1) {
      // Budget was synced, so track deletion for server sync
      await db.runAsync(
        'INSERT INTO budget_changes (budget_id) VALUES (?)',
        [budgetId]
      );
      console.log(`📝 Tracking deletion of synced budget ${budgetId}`);
    } else {
      // Budget was never synced, no need to track deletion
      console.log(`🗑️ Deleting unsynced budget ${budgetId} - no server sync needed`);
    }
    
    // Delete the budget from local database
    await db.runAsync('DELETE FROM budget WHERE id = ?', [budgetId]);
    
  } catch (error: any) {
    console.error(`❌ Error tracking budget deletion ${budgetId}:`, error.message);
    throw error;
  }
}


// Sync All
export async function syncAll(db: SQLiteDatabase, email: string) {
  try {
    await syncNewExpenses(db, email);
     await syncExpenseChanges(db, email);
      await syncNewBudgets(db, email);
        await syncDeletedBudgets(db, email);
console.log("Expense table:", await db.getAllAsync("SELECT * FROM expenses"));
console.log("Expense Changes table:", await db.getAllAsync("SELECT * FROM expense_changes"));
    console.log('Sync completed successfully');
  } catch (err: any) {
    console.error('Sync failed:', err.message);
  }
}


 
