import { useTheme } from "@/context/ThemeContext";
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const { theme, currency,  setIsDataUpdated } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [userName, setUserName] = useState("John Doe");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    // Add new state for month/year selection
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year range (current year ± 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
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
        bg: '#f3f4f6',         // light grey background
        card: '#e5e7eb',       // grey card
        text: '#18181b',       // dark text
        subText: '#6b7280',    // grey subtext
        modalBg: '#e5e7eb',    // grey modal background
        modalText: '#18181b',  // dark modal text
        modalCancel: '#6b7280',// grey cancel text
        icon: '#22c55e',       // green accent
      };

  // Updated fetchExpenses function with date filtering
  const fetchExpenses = async () => {
    // Create date range for selected month/year
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    
    const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
    const endDateStr = endDate.toISOString().slice(0, 19).replace('T', ' ');

    console.log(`📅 Fetching expenses for ${monthNames[selectedMonth]} ${selectedYear}`);
    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);

    // Get filtered expenses
    const results = await db.getAllAsync<Expense>(
      'SELECT * FROM expenses WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
      [startDateStr, endDateStr]
    );
    setExpenses(results);

    // Get filtered total income
    const incomeResult = await db.getFirstAsync<{ total: number }>(
      "SELECT SUM(amount) as total FROM expenses WHERE type = 'income' AND created_at >= ? AND created_at <= ?",
      [startDateStr, endDateStr]
    );
    setTotalIncome(incomeResult?.total ?? 0);

    // Get filtered total expense
    const expenseResult = await db.getFirstAsync<{ total: number }>(
      "SELECT SUM(amount) as total FROM expenses WHERE type = 'expense' AND created_at >= ? AND created_at <= ?",
      [startDateStr, endDateStr]
    );
    setTotalExpense(expenseResult?.total ?? 0);
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);
    };
    
    fetchUserName();
    fetchExpenses(); // This will now use the selected month/year
  }, [db, selectedMonth, selectedYear]); // Re-fetch when month/year changes


  // Handler for long press
  const handleLongPress = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };
// Updated handleDelete function
  const handleDelete = async () => {
    if (selectedExpense) {
      const expenseId = selectedExpense.id;
      
      // Check if the expense isUploaded or not
      const expense = await db.getFirstAsync<{ isUploaded: number }>(`SELECT isUploaded FROM expenses WHERE id = ?`, [expenseId]);

      if (expense && expense.isUploaded === 1) {
        console.log('Tracking deletion for synced expense:', expenseId);
        await db.runAsync(
          `INSERT INTO expense_changes (action, expense_id)
          SELECT 'deleted', ?
          WHERE NOT EXISTS (
            SELECT 1 FROM expense_changes
            WHERE action = 'deleted' AND expense_id = ? AND isSynced = 0
          )`,
          [expenseId, expenseId]
        );
      }
      
      setIsDataUpdated(false);
      await db.runAsync('DELETE FROM expenses WHERE id = ?', selectedExpense.id);
      setModalVisible(false);
      setSelectedExpense(null);
      
      // Refresh the filtered data
      fetchExpenses();
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
      {/* User info and Date Selection in same row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        {/* Left side - User info */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name="person-circle"
            size={40}
            color={colors.icon}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        </View>
        
        {/* Right side - Date Selection */}
        <TouchableOpacity 
          style={styles.dateSelectionBox}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={[styles.dateSelectionText, { color: colors.text }]}>
            {monthNames[selectedMonth]} {selectedYear}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Balance section remains the same */}
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
      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.datePickerModal, { backgroundColor: colors.modalBg }]}>
            <View style={styles.datePickerHeader}>
              <Text style={[styles.datePickerTitle, { color: colors.modalText }]}>Select Month & Year</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.modalText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              {/* Month Selection */}
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: colors.modalText }]}>Month</Text>
                <ScrollView 
                  style={styles.pickerScrollView} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {monthNames.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && { backgroundColor: colors.icon + '30' }
                      ]}
                      onPress={() => {
                        console.log('Month selected:', index, monthNames[index]);
                        setSelectedMonth(index);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { color: selectedMonth === index ? colors.icon : colors.modalText }
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Selection */}
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: colors.modalText }]}>Year</Text>
                <ScrollView 
                  style={styles.pickerScrollView} 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && { backgroundColor: colors.icon + '30' }
                      ]}
                      onPress={() => {
                        console.log('Year selected:', year);
                        setSelectedYear(year);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { color: selectedYear === year ? colors.icon : colors.modalText }
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.icon }]}
                onPress={() => {
                  console.log('Done button pressed - selections:', {
                    month: selectedMonth,
                    monthName: monthNames[selectedMonth],
                    year: selectedYear
                  });
                  setDatePickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  dateSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  
  // Modal styles
 modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerModal: {
    borderRadius: 16,
    padding: 0,
    width: '90%',
    height: '60%', // Changed from maxHeight to fixed height
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  datePickerContent: {
    flexDirection: 'row',
    flex: 1, // This ensures content takes available space
    height: '100%', // Added explicit height
  },
  pickerSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 200, // Added minimum height
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerScrollView: {
    flex: 1, // Changed from maxHeight to flex
    borderWidth: 1, // Add temporary border to see the boundaries
    borderColor: '#333',
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 15, // Increased padding for better touch targets
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    minHeight: 44, // Added minimum touch target size
  },
  pickerItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  datePickerActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#666',
  },
  actionButton: {
    padding: 15, // Increased padding
    borderRadius: 8,
    width: '100%',
    minHeight: 44, // Added minimum touch target
  },
  actionButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  dateSelectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align to right
  },
    dateSelectionBox: {
    // Removed borderWidth, elevation, shadow for clean look
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 6,
  },
  dateSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
});