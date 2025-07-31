import { useTheme } from '@/context/ThemeContext';
import { trackBudgetDeletion } from '@/services/server';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Progress from 'react-native-progress';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: 'restaurant-outline',
  Entertainment: 'game-controller-outline',
  Phone: 'phone-portrait-outline',
  Transport: 'bus-outline',
  Shopping: 'cart-outline',
  Bills: 'document-text-outline',
  Education: 'school-outline',
  Health: 'medkit-outline',
  Gifts: 'gift-outline',
  Subscriptions: 'card-outline',
  Travel: 'airplane-outline',
  Salary: 'cash-outline',
  Freelance: 'briefcase-outline',
  Investment: 'trending-up-outline',
  Refunds: 'refresh-outline',
  Others: 'ellipsis-horizontal-outline',
};

type BudgetItem = {
  id: number;
  category: string;
  budget: number;
  expenses: number;
  budget_month: number;
  budget_year: number;
};

export default function BudgetScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { theme, setIsDataUpdated } = useTheme();

  // Month/Year selection state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
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

  const colors = useMemo(() => {
    return theme === 'dark'
      ? {
          background: '#18181b',
          card: '#27272a',
          text: '#fde047',
          border: '#444',
          subtitle: '#a1a1aa',
          progressColor: '#22c55e',
          progressBg: '#404040',
          iconCircleBg: '#404040',
          addBtnBg: '#fde047',
          addBtnText: '#18181b',
          modalBg: '#27272a',
          modalText: '#fde047',
          icon: '#fde047',
          summary: '#1f2937',
        }
      : {
          background: '#f9fafb',
          card: '#ffffff',
          text: '#111827',
          border: '#e5e7eb',
          subtitle: '#6b7280',
          progressColor: '#22c55e',
          progressBg: '#e5e7eb',
          iconCircleBg: '#f3f4f6',
          addBtnBg: '#22c55e',
          addBtnText: '#ffffff',
          modalBg: '#ffffff',
          modalText: '#111827',
          icon: '#111827',
          summary: '#f3f4f6',
        };
  }, [theme]);

  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Budget summary state
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await db.getAllAsync<{ category_name: string }>(
          'SELECT category_name FROM category WHERE type = "expense"'
        );
        setCategories(result.map(row => row.category_name));
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, [db]);

  useEffect(() => {
    fetchBudgetData();
    const unsubscribe = navigation.addListener('focus', fetchBudgetData);
    return unsubscribe;
  }, [selectedMonth, selectedYear]);

  const fetchBudgetData = async () => {
    try {
      console.log(`📊 Fetching budget data for ${monthNames[selectedMonth - 1]} ${selectedYear}`);
      
      // Get budget data for selected month/year with actual expenses
      const result = await db.getAllAsync<BudgetItem>(
        `SELECT 
          b.id, 
          b.category, 
          b.amount AS budget,
          b.budget_month,
          b.budget_year,
          COALESCE(SUM(CASE WHEN e.type = 'expense' 
            AND strftime('%m', e.created_at) = printf('%02d', b.budget_month)
            AND strftime('%Y', e.created_at) = CAST(b.budget_year AS TEXT)
            THEN e.amount ELSE 0 END), 0) AS expenses
         FROM budget b
         LEFT JOIN expenses e ON b.category = e.category
         WHERE b.budget_month = ? AND b.budget_year = ?
         GROUP BY b.id, b.category, b.amount, b.budget_month, b.budget_year
         ORDER BY b.category`,
        [selectedMonth, selectedYear]
      );

      setBudgetData(result);

      // Calculate totals
      const budgetTotal = result.reduce((sum, item) => sum + item.budget, 0);
      const expenseTotal = result.reduce((sum, item) => sum + item.expenses, 0);
      
      setTotalBudget(budgetTotal);
      setTotalExpenses(expenseTotal);

      console.log(`📊 Found ${result.length} budget items for ${monthNames[selectedMonth - 1]} ${selectedYear}`);
    } catch (error) {
      console.error('❌ Failed to fetch budget data:', error);
    }
  };

  const handleSaveBudget = async () => {
    if (!newCategory.trim() || !newAmount.trim()) {
      Alert.alert('Validation Error', 'Please select a category and enter an amount');
      return;
    }
    if (isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than zero');
      return;
    }

    try {
      if (isEditing && editingId !== null) {
        // Update existing budget
        await db.runAsync(
          'UPDATE budget SET category = ?, amount = ?, isSynced = ? WHERE id = ?',
          [newCategory.trim(), Number(newAmount), 0, editingId]
        );

        
      } else {
        // Check for existing budget for this category/month/year
        const existing = await db.getFirstAsync(
          'SELECT id FROM budget WHERE category = ? AND budget_month = ? AND budget_year = ?',
          [newCategory.trim(), selectedMonth, selectedYear]
        );
        
        if (existing) {
          Alert.alert(
            'Budget Exists', 
            `A budget for ${newCategory} already exists for ${monthNames[selectedMonth - 1]} ${selectedYear}. Would you like to update it?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Update', 
                onPress: async () => {
                  await db.runAsync(
                    'UPDATE budget SET amount = ? WHERE category = ? AND budget_month = ? AND budget_year = ?',
                    [Number(newAmount), newCategory.trim(), selectedMonth, selectedYear]
                  );
                  resetForm();
                  fetchBudgetData();
                }
              }
            ]
          );
          return;
        }

        // Insert new budget
        await db.runAsync(
          'INSERT INTO budget (category, amount, budget_month, budget_year) VALUES (?, ?, ?, ?)',
          [newCategory.trim(), Number(newAmount), selectedMonth, selectedYear]
        );
      }
      setIsDataUpdated(false);

      resetForm();
      fetchBudgetData();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  const resetForm = () => {
    setNewCategory('');
    setNewAmount('');
    setShowAddForm(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDelete = (id: number, category: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the budget for ${category}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await trackBudgetDeletion(db, id);
              //await db.runAsync('DELETE FROM budget WHERE id = ?', [id]);
              fetchBudgetData();
              setIsDataUpdated(false);
            } catch (error) {
              console.error('❌ Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const handleCopyFromPreviousMonth = async () => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    try {
      const previousBudgets = await db.getAllAsync<{ category: string; amount: number }>(
        'SELECT category, amount FROM budget WHERE budget_month = ? AND budget_year = ?',
        [prevMonth, prevYear]
      );

      if (previousBudgets.length === 0) {
        Alert.alert('No Data', `No budget data found for ${monthNames[prevMonth - 1]} ${prevYear}`);
        return;
      }

      Alert.alert(
        'Copy Previous Budget',
        `Copy ${previousBudgets.length} budget items from ${monthNames[prevMonth - 1]} ${prevYear}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy',
            onPress: async () => {
              try {
                for (const budget of previousBudgets) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO budget (category, amount, budget_month, budget_year) 
                     VALUES (?, ?, ?, ?)`,
                    [budget.category, budget.amount, selectedMonth, selectedYear]
                  );
                }
                fetchBudgetData();
                Alert.alert('Success', 'Budget copied successfully!');
              } catch (error) {
                console.error('Error copying budget:', error);
                Alert.alert('Error', 'Failed to copy budget');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error fetching previous budget:', error);
      Alert.alert('Error', 'Failed to fetch previous budget');
    }
  };

  const renderCategory = ({ item }: { item: BudgetItem }) => {
    const remaining = Math.max( item.budget - item.expenses);
    const percentage = item.budget > 0 ? Math.min(1, item.expenses / item.budget) : 0;
    const isOverBudget = item.expenses > item.budget;
    const iconName = iconMap[item.category] || 'ellipse-outline';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.iconTitleRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Ionicons name={iconName} size={20} color={colors.text} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.category}</Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setEditingId(item.id);
                setNewCategory(item.category);
                setNewAmount(item.budget.toString());
                setShowAddForm(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.category)}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.budgetInfoRow}>
          <Progress.Circle
            size={70}
            progress={percentage}
            showsText
            formatText={() => isOverBudget ? 'Over\nBudget!' : `${Math.round((1 - percentage) * 100)}%\nLeft`}
            color={isOverBudget ? '#ef4444' : colors.progressColor}
            unfilledColor={colors.progressBg}
            thickness={6}
            borderWidth={0}
            textStyle={{ 
              fontSize: 10, 
              textAlign: 'center', 
              color: isOverBudget ? '#ef4444' : colors.text,
              fontWeight: '600'
            }}
          />
          <View style={styles.details}>
            <Text style={[styles.label, { color: colors.subtitle }]}>
              Budget: <Text style={[styles.value, { color: colors.text }]}>${item.budget.toLocaleString()}</Text>
            </Text>
            <Text style={[styles.label, { color: colors.subtitle }]}>
              Spent: <Text style={[styles.value, { color: isOverBudget ? '#ef4444' : colors.text }]}>
                ${item.expenses.toLocaleString()}
              </Text>
            </Text>
            <Text style={[styles.label, { color: colors.subtitle }]}>
              {isOverBudget ? 'Over by: ' : 'Remaining: '}
              <Text style={[styles.value, { color: isOverBudget ? '#ef4444' : '#22c55e' }]}>
                ${Math.abs(remaining).toLocaleString()}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Date Selection */}
      <View style={styles.dateSelectionContainer}>
        <TouchableOpacity 
          style={[styles.dateSelectionBox, { 
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={[styles.dateSelectionText, { color: colors.text }]}>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Copy Previous Month Button */}
        <TouchableOpacity 
          style={[styles.copyButton, { backgroundColor: colors.icon + '20', borderColor: colors.icon }]}
          onPress={handleCopyFromPreviousMonth}
        >
          <Ionicons name="copy-outline" size={16} color={colors.icon} />
          <Text style={[styles.copyButtonText, { color: colors.icon }]}>Copy Previous</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Summary */}
      {budgetData.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.summary, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Budget Overview</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.subtitle }]}>Total Budget</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>${totalBudget.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.subtitle }]}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: totalExpenses > totalBudget ? '#ef4444' : colors.text }]}>
                ${totalExpenses.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.subtitle }]}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: totalBudget - totalExpenses >= 0 ? '#22c55e' : '#ef4444' }]}>
                ${Math.abs(totalBudget - totalExpenses).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Text style={[styles.header, { color: colors.text }]}>Budget</Text>
      </View>

      <FlatList
        data={budgetData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategory}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={colors.subtitle} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Budget Set</Text>
            <Text style={[styles.emptySubtitle, { color: colors.subtitle }]}>
              Create your first budget for {monthNames[selectedMonth - 1]} {selectedYear}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Budget Button */}
      <View style={styles.addBtnWrapper}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.addBtnBg }]}
          onPress={() => {
            setIsEditing(false);
            setEditingId(null);
            setNewCategory('');
            setNewAmount('');
            setShowAddForm(true);
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={25}
            color={colors.addBtnText}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.addBtnText, { color: colors.addBtnText }]}>Add Budget</Text>
        </TouchableOpacity>
      </View>

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
                        selectedMonth === index + 1 && { backgroundColor: colors.icon + '30' }
                      ]}
                      onPress={() => setSelectedMonth(index + 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { color: selectedMonth === index + 1 ? colors.icon : colors.modalText }
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
                      onPress={() => setSelectedYear(year)}
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
                onPress={() => setDatePickerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Budget Form Modal */}
      {showAddForm && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={resetForm}
          />
          <View style={styles.centeredContainer}>
            <View style={[styles.addFormContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Budget' : `Add Budget for ${monthNames[selectedMonth - 1]} ${selectedYear}`}
              </Text>
              
              {/* Category Dropdown */}
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <Picker
                  selectedValue={newCategory}
                  onValueChange={(itemValue) => setNewCategory(itemValue)}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="Select Category" value="" />
                  {categories.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
              
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Enter budget amount"
                placeholderTextColor={colors.subtitle}
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="numeric"
              />
              
              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget}>
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16 
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  
  // Date Selection Styles
  dateSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSelectionBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  dateSelectionText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  copyButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Summary Card
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Budget Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600' 
  },
  actionBtns: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  budgetInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 20 
  },
  details: { 
    marginLeft: 16,
    flex: 1,
  },
  label: { 
    fontSize: 14,
    marginBottom: 4,
  },
  value: { 
    fontWeight: '600',
    fontSize: 16,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Add Button
  addBtnWrapper: {
    position: 'absolute',
    bottom: 90,
    left: 70,
    right: 70,
    zIndex: 10,
  },
  addBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal Styles
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
    height: '60%',
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
    flex: 1,
    height: '100%',
  },
  pickerSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 200,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerScrollView: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    minHeight: 44,
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
    padding: 15,
    borderRadius: 8,
    width: '100%',
    minHeight: 44,
  },
  actionButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },

  // Form Modal
  centeredContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  addFormContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});