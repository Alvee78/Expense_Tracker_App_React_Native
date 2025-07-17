import { useTheme } from "@/context/ThemeContext";
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { verticalScale } from "react-native-size-matters";
import ExpenseCard from '../../components/ExpenseCard';

type Expense = {
  id: number;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  isUploaded: number;
  created_at: string;
};

const Home = () => {
  const db = useSQLiteContext();
  const { theme, currency } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [userName, setUserName] = useState("John Doe");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Yellow-based light theme, dark theme for contrast
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        card: '#27272a',
        text: '#fde047', // yellow-300
        subText: '#a1a1aa',
        modalBg: '#27272a',
        modalText: '#fde047',
        modalCancel: '#a1a1aa',
        icon: '#fde047',
      }
    : {
        bg: '#fffbe6', 
        card: '#fde047', 
        text: '#18181b',
        subText: '#b45309', // amber-700
        modalBg: '#fffbe6',
        modalText: '#18181b',
        modalCancel: '#b45309',
        icon: '#b45309',
      };

  useEffect(() => {
    const fetchUserName = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);
    };
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
    fetchUserName();
    fetchExpenses();
  }, [db]);

  // Handler for long press
  const handleLongPress = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };
  // Handler for delete
  const handleDelete = async () => {
    if (selectedExpense) {
      await db.runAsync('DELETE FROM expenses WHERE id = ?', selectedExpense.id);
      setExpenses(expenses.filter(e => e.id !== selectedExpense.id));
      setModalVisible(false);
      setSelectedExpense(null);
    }
  };
  // Handler for edit
  const handleEdit = () => {
    if (!selectedExpense) return;
    router.replace(`./UpdateTransaction?id=${selectedExpense.id}`);
    setModalVisible(false);
  };
  const netBalance = totalIncome - totalExpense;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Summary Section */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.card, shadowColor: theme === 'dark' ? '#000' : '#b45309' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons
            name="person-circle"
            size={40}
            color={colors.icon}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balanceBox}>
            <Text style={[styles.label, { color: colors.subText }]}>Income</Text>
            <Text style={[styles.value, { color: '#22c55e' }]}>{currency}{totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={[styles.label, { color: colors.subText }]}>Expense</Text>
            <Text style={[styles.value, { color: '#ef4444' }]}>{currency}{totalExpense.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={[styles.label, { color: colors.subText }]}>Net</Text>
            <Text style={[styles.value, { color: netBalance >= 0 ? '#22c55e' : '#ef4444' }]}>{currency}{netBalance.toFixed(2)}</Text>
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
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32, color: colors.subText }}>
            No expenses found.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: verticalScale(80) }}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}>
          <View style={{
            backgroundColor: colors.modalBg,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            width: 250
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: colors.modalText }}>Choose an action</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#ef4444', padding: 12, borderRadius: 8, width: '100%', marginBottom: 8 }}
              onPress={handleDelete}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#22c55e', padding: 12, borderRadius: 8, width: '100%' }}
              onPress={handleEdit}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 12 }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: colors.modalCancel, textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  summaryContainer: {
    borderEndEndRadius: 16,
    borderStartEndRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
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
    color: '#18181b'
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
    color: '#7c2d12'
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
    color: '#18181b',
  }
});