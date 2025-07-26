  import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Fatch user data
export async function fetchAndStoreUserData(db: SQLiteDatabase,email: string) {
  try {
    console.log('🔄 Fetching user data from server...');
    
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    const response = await fetch(`http://${Localhost}/get_user.php`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `http://${Localhost}/`,
        'Origin': `http://${Localhost}`,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({ email: email }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Get the raw response text first
    const responseText = await response.text();
    console.log('📡 Raw response length:', responseText.length);
    console.log('📡 Response start:', responseText.substring(0, 100));

    // Try to extract JSON from potentially contaminated response
    let cleanJsonText = responseText;
    
    // Check if response contains HTML/JavaScript injection
    if (responseText.includes('<html>') || responseText.includes('<script>')) {
      console.warn('⚠️ Response contains HTML, attempting to extract JSON...');
      
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/(\{.*\})/s);
      if (jsonMatch) {
        cleanJsonText = jsonMatch[1];
        console.log('✅ Extracted JSON:', cleanJsonText.substring(0, 100));
      } else {
        throw new Error('No valid JSON found in response');
      }
    }

    // Parse the cleaned JSON
    let data;
    try {
      data = JSON.parse(cleanJsonText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed to parse:', cleanJsonText.substring(0, 200));
      throw new Error('Invalid JSON response from server');
    }

    console.log('📦 Parsed server response:', data);

    // Handle server errors
    if (data.error) {
      console.error('❌ Server error:', data.error);
      throw new Error(`Server error: ${data.error}`);
    }

    // Validate response structure
    if (!data.user) {
      throw new Error('No user data received from server');
    }

    // Save user data
    try {
      await AsyncStorage.setItem('userName', data.user.user_name || 'User');
      console.log('✅ User name saved:', data.user.user_name);
    } catch (storageError) {
      console.error('❌ Failed to save user name:', storageError);
      throw new Error('Failed to save user data locally');
    }

    // Save expenses
    if (data.expenses && Array.isArray(data.expenses)) {
      let savedCount = 0;
      let errorCount = 0;

      console.log(`💾 Saving ${data.expenses.length} expenses...`);

      for (const item of data.expenses) {
        try {
          if (!item.expense_id || !item.category || !item.amount || !item.type || !item.created_at) {
            console.warn('⚠️ Invalid expense data:', item);
            errorCount++;
            continue;
          }

          await db.runAsync(
            `INSERT OR IGNORE INTO expenses 
            (id, category, amount, type, description, created_at, isUploaded)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
              item.expense_id,
              item.category,
              parseFloat(item.amount),
              item.type,
              item.description || '',
              item.created_at,
            ]
          );
          savedCount++;
        } catch (dbError) {
          console.error('❌ Database error for expense:', item.expense_id, dbError);
          errorCount++;
        }
      }

      console.log(`💾 Expenses: ${savedCount} saved, ${errorCount} errors`);
    } else {
      console.log('📝 No expenses to sync');
    }

    // Save budgets
    if (data.budgets && Array.isArray(data.budgets)) {
      let savedBudgetCount = 0;
      let errorBudgetCount = 0;

      console.log(`📊 Saving ${data.budgets.length} budgets...`);

      for (const budget of data.budgets) {
        try {
          // Validate budget data
          if (!budget.budget_id || !budget.category || !budget.amount || 
              !budget.budget_month || !budget.budget_year) {
            console.warn('⚠️ Invalid budget data:', budget);
            errorBudgetCount++;
            continue;
          }

          // Validate month and year ranges
          if (budget.budget_month < 1 || budget.budget_month > 12) {
            console.warn('⚠️ Invalid budget month:', budget.budget_month);
            errorBudgetCount++;
            continue;
          }

          if (budget.budget_year < 2020 || budget.budget_year > 2050) {
            console.warn('⚠️ Invalid budget year:', budget.budget_year);
            errorBudgetCount++;
            continue;
          }

          // Insert budget with ON CONFLICT REPLACE to handle duplicates
          await db.runAsync(
            `INSERT OR REPLACE INTO budget 
            (id, category, amount, budget_month, budget_year, created_at, isSynced)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
              budget.budget_id,
              budget.category,
              parseFloat(budget.amount),
              parseInt(budget.budget_month),
              parseInt(budget.budget_year),
              budget.created_at || new Date().toISOString(),
            ]
          );
          savedBudgetCount++;
        } catch (dbError) {
          console.error('❌ Database error for budget:', budget.budget_id, dbError);
          errorBudgetCount++;
        }
      }

      console.log(`📊 Budgets: ${savedBudgetCount} saved, ${errorBudgetCount} errors`);
    } else {
      console.log('📊 No budgets to sync');
    }

    console.log('✅ User, expenses, and budgets synced successfully');
      await AsyncStorage.setItem('userDataFetched', 'true'); // Reset flag
    return { success: true, message: 'Data synced successfully' };

  } catch (err: any) {
    console.error('❌ Failed to sync data:', err.message);
    
    let userMessage = 'Failed to sync user data';
    
    if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
      userMessage = 'No internet connection. Please check your network.';
    } else if (err.message.includes('timeout')) {
      userMessage = 'Connection timeout. Please try again.';
    } else if (err.message.includes('404')) {
      userMessage = 'Server endpoint not found. Please contact support.';
    } else if (err.message.includes('500')) {
      userMessage = 'Server error. Please try again later.';
    } else if (err.message.includes('Invalid email')) {
      userMessage = 'Invalid email address provided.';
    } else if (err.message.includes('No valid JSON')) {
      userMessage = 'Server configuration issue. Please contact support.';
    }
    
    return { success: false, message: userMessage, error: err.message };
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


 
