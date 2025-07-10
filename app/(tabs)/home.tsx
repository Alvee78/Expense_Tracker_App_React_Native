import { StyleSheet, Text, View, Image, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react'
import { useSQLiteContext } from 'expo-sqlite'
import ExpenseCard from '../../components/ExpenseCard'

type Expense = {
  id: number;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  isUploaded: number;
  created_at: string;
};

const DUMMY_USER = {
    name: "John Doe",
    avatar: require('../../assets/images/icon.png') // Replace with your avatar image path
};

const Home = () => {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    const fetchExpenses = async () => {
        const results = await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY created_at DESC');
        setExpenses(results);

        // Get total income
        const incomeResult = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(amount) as total FROM expenses WHERE type = 'income'");
        setTotalIncome(incomeResult?.total ?? 0);

        // Get total expense
        const expenseResult = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(amount) as total FROM expenses WHERE type = 'expense'");
        setTotalExpense(expenseResult?.total ?? 0);

    };
    fetchExpenses();
  }, [db]);

  const netBalance = totalIncome - totalExpense;

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      {/* Summary Section */}
      <View style={styles.summaryContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons
                name="person-circle"
                size={40}
                color="green"
                style={{ marginRight: 12 }}
            />
            <Text style={styles.userName}>Alvee</Text>
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balanceBox}>
            <Text style={styles.label}>Income</Text>
            <Text style={[styles.value, { color: '#22c55e' }]}>${totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.label}>Expense</Text>
            <Text style={[styles.value, { color: '#ef4444' }]}>${totalExpense.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.label}>Net</Text>
            <Text style={[styles.value, { color: netBalance >= 0 ? '#22c55e' : '#ef4444' }]}>${netBalance.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={expenses}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard
            category={item.category}
            amount={item.amount}
            description={item.description}
            date={item.created_at}
            type={item.type}
          />
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>No expenses found.</Text>}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#eee'
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  balanceBox: {
    alignItems: 'center',
    flex: 1
  },
  label: {
    fontSize: 14,
    color: '#888'
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2
  }
});