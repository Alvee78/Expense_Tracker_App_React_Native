import { useTheme } from '@/context/ThemeContext';
import { Localhost } from '@/services/MagicWord';
import { useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';

export default function Page() {
  const db = useSQLiteContext();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Improved grey-based light theme
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        card: '#232323',
        border: '#fde047',
        title: '#fde047',
        inputBg: '#232323',
        inputText: '#fde047',
        button: '#fde047',
        buttonText: '#18181b',
        link: '#fde047',
        text: '#fde047',
      }
    : {
        bg: '#f3f4f6',        // light grey background
        card: '#e5e7eb',      // grey card
        border: '#e5e7eb',    // subtle grey border
        title: '#22c55e',     // green accent for title
        inputBg: '#fff',      // white input
        inputText: '#18181b', // dark text
        button: '#22c55e',    // green button
        buttonText: '#fff',   // white button text
        link: '#22c55e',      // green link
        text: '#18181b',      // dark text
      };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        await fetchAndStoreUserData(emailAddress);
        router.replace('/');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };


  // Fetch and store user data from the server
// Updated fetchAndStoreUserData function
async function fetchAndStoreUserData(email: string) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.formWrapper, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.title }]}>Sign in</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={setPassword}
          placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
        />
      {isLoading?<View style={[styles.button, { backgroundColor: colors.button }]}>
        <ActivityIndicator size="small" color={colors.buttonText} />
      </View>:<TouchableOpacity style={[styles.button, { backgroundColor: colors.button }]} onPress={onSignInPress}>
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>Continue</Text>
      </TouchableOpacity>}
        <View style={styles.row}>
          <Text style={[styles.text, { color: colors.text }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/sign-up')}>
            <Text style={[styles.link, { color: colors.link }]}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrapper: {
    borderRadius: 30,
    borderWidth: 1,
    paddingVertical: verticalScale(32),
    paddingHorizontal: verticalScale(24),
    width: '90%',
    alignItems: 'center',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: scale(32),
    fontWeight: '700',
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: verticalScale(14),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderRadius: verticalScale(8),
    fontSize: scale(16),
  },
  button: {
    paddingVertical: verticalScale(14),
    borderRadius: verticalScale(8),
    marginBottom: verticalScale(18),
    alignItems: 'center',
    width: '100%',
    marginTop: verticalScale(8),
    height: verticalScale(45),
  },
  buttonText: {
    fontWeight: '600',
    fontSize: scale(18),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  text: {
    fontSize: scale(15),
  },
  link: {
    fontWeight: '600',
    fontSize: scale(15),
    marginLeft: scale(4),
  },
});