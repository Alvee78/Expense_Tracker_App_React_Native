import { useTheme } from '@/context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function UpdateTransactionPage() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, setIsDataUpdated, currency } = useTheme();

  // Theme colors
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        card: '#232323',
        text: '#fde047',
        inputBg: '#232323',
        inputText: '#fde047',
        border: '#444',
        accent: '#6366f1',
        btnCancel: '#6b7280',
        btnUpdate: '#6366f1',
        btnCat: '#10b981',
        btnCatText: '#18181b',
        modalBg: '#232323',
        modalText: '#fde047',
        modalCancel: '#ef4444',
        modalAdd: '#10b981',
      }
    : {
        bg: '#f3f4f6',        // match Home bg
        card: '#e5e7eb',      // match Home card
        text: '#18181b',      // match Home text
        inputBg: '#fff',      // white input
        inputText: '#18181b', // dark text
        border: '#e5e7eb',    // subtle grey border
        accent: '#22c55e',    // green accent
        btnCancel: '#6b7280', // grey cancel
        btnUpdate: '#22c55e', // green update
        btnCat: '#22c55e',    // green add category
        btnCatText: '#fff',   // white text
        modalBg: '#e5e7eb',   // match Home modal
        modalText: '#18181b', // dark modal text
        modalCancel: '#6b7280', // grey cancel text
        modalAdd: '#22c55e',  // green add
      };

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');

  // Fetch transaction and categories
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      const tx = await db.getFirstAsync<any>(
        'SELECT * FROM expenses WHERE id = ?',
        Number(id)
      );

      if (!tx) {
        Alert.alert('Transaction not found');
        router.back();
        return;
      }

      setType(tx.type);
      setAmount(tx.amount.toString());
      setDescription(tx.description);
      setSelectedCategory(tx.category);
      setDate(new Date(tx.created_at));

      const result = await db.getAllAsync<{ category_name: string }>(
        'SELECT category_name FROM category WHERE type = ?',
        tx.type
      );
      setCategories(result.map((r) => r.category_name));
    }

    fetchData();
  }, [id]);

  // Update transaction
  const handleUpdateTransaction = async () => {
    if (!selectedCategory || !amount) {
      Alert.alert('Please fill in all fields');
      return;
    }

    try {
      await db.runAsync(
        'UPDATE expenses SET category = ?, amount = ?, type = ?, description = ?, created_at = ? WHERE id = ?',
        selectedCategory,
        parseFloat(amount),
        type,
        description,
        format(date, 'yyyy-MM-dd HH:mm:ss'),
        Number(id)
      );
      const expenseId = id;
      
      // 1. Check if expense is uploaded
      const expense = await db.getFirstAsync<{ isUploaded: number }>(`SELECT isUploaded FROM expenses WHERE id = ?`, [expenseId]);

      // 2. If expense is uploaded, track edited action
      if (expense && expense.isUploaded === 1) {
        await db.runAsync(
          `INSERT INTO expense_changes (action, expense_id)
          SELECT 'edited', ?
          WHERE NOT EXISTS (
            SELECT 1 FROM expense_changes WHERE action = 'edited' AND expense_id = ? AND isSynced = 0
          )`,
          [expenseId, expenseId]
        );
      }
      

      setIsDataUpdated(false);
      
      // Check budget after updating expense (only if it's an expense)
      if (type === 'expense') {
        await checkBudgetAfterTransaction(selectedCategory, parseFloat(amount));
      }
      
      //Alert.alert('Transaction updated!');
      router.replace('./home');
    } catch (e) {
      console.error(e);
      Alert.alert('Update failed');
    }
  };

  // Check budget after updating transaction
  const checkBudgetAfterTransaction = async (category: string, transactionAmount: number) => {
    const transactionDate = date;
    const transactionMonth = transactionDate.getMonth() + 1;
    const transactionYear = transactionDate.getFullYear();
    
    try {
      // Get budget for this category and month/year
      const budget = await db.getFirstAsync<{ amount: number }>(
        'SELECT amount FROM budget WHERE category = ? AND budget_month = ? AND budget_year = ?',
        [category, transactionMonth, transactionYear]
      );
      
      if (!budget) {
        // No budget set for this category, skip checking
        return;
      }
      
      // Get total spent in this category for this month/year
      const monthYearStr = `${transactionYear}-${transactionMonth.toString().padStart(2, '0')}`;
      const spent = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE category = ? AND type = 'expense' 
         AND strftime('%Y-%m', created_at) = ?`,
        [category, monthYearStr]
      );
      
      const totalSpent = spent?.total || 0;
      const percentage = (totalSpent / budget.amount) * 100;
      const overAmount = totalSpent - budget.amount;
      
      if (percentage > 100) {
        // Over budget - Critical alert
        Alert.alert(
          '🚨 Budget Exceeded!',
          `You've exceeded your ${category} budget!\n\n` +
          `💰 Budget: ${currency}${budget.amount.toFixed(2)}\n` +
          `💸 Spent: ${currency}${totalSpent.toFixed(2)}\n` +
          `⚠️ Over by: ${currency}${overAmount.toFixed(2)}\n\n` +
          `This transaction: ${currency}${transactionAmount.toFixed(2)}`,
          [
            { text: 'View Budget', onPress: () => router.push('./budget') },
            { text: 'OK', style: 'default' }
          ]
        );
      } else if (percentage > 90) {
        // Very close to limit - Warning
        Alert.alert(
          '⚠️ Budget Alert!',
          `You're very close to your ${category} budget limit!\n\n` +
          `💰 Budget: ${currency}${budget.amount.toFixed(2)}\n` +
          `💸 Spent: ${currency}${totalSpent.toFixed(2)}\n` +
          `📊 Used: ${percentage.toFixed(1)}%\n` +
          `💵 Remaining: ${currency}${(budget.amount - totalSpent).toFixed(2)}`,
          [
            { text: 'View Budget', onPress: () => router.push('./budget') },
            { text: 'OK' }
          ]
        );
      } else if (percentage > 75) {
        // Getting high - Gentle warning
        Alert.alert(
          '📊 Budget Update',
          `You've used ${percentage.toFixed(1)}% of your ${category} budget.\n\n` +
          `💰 Budget: ${currency}${budget.amount.toFixed(2)}\n` +
          `💸 Spent: ${currency}${totalSpent.toFixed(2)}\n` +
          `💵 Remaining: ${currency}${(budget.amount - totalSpent).toFixed(2)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking budget:', error);
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory) return;
    const existing = await db.getFirstAsync<{ category_name: string }>(
      'SELECT category_name FROM category WHERE category_name = ? AND type = ?',
      newCategory,
      type
    );
    if (existing) {
      Alert.alert('Category already exists!');
      return;
    }
    await db.runAsync(
      'INSERT INTO category (category_name, type) VALUES (?, ?)',
      newCategory,
      type
    );
    setNewCategory('');
    setShowAddCatModal(false);
    
    // Refresh categories list
    const result = await db.getAllAsync<{ category_name: string }>(
      'SELECT category_name FROM category WHERE type = ?',
      type
    );
    setCategories(result.map((r) => r.category_name));
    
    Alert.alert('Category added');
  };

  // Delete category
  const handleDeleteCategory = async (categoryName: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if category is being used in expenses
              const usageCount = await db.getFirstAsync<{ count: number }>(
                'SELECT COUNT(*) as count FROM expenses WHERE category = ?',
                [categoryName]
              );
              
              if (usageCount && usageCount.count > 0) {
                Alert.alert(
                  'Cannot Delete',
                  `This category is used in ${usageCount.count} transaction(s). You cannot delete a category that is being used.`
                );
                return;
              }

              // Delete the category
              await db.runAsync(
                'DELETE FROM category WHERE category_name = ? AND type = ?',
                [categoryName, type]
              );
              
              // Refresh categories list
              const result = await db.getAllAsync<{ category_name: string }>(
                'SELECT category_name FROM category WHERE type = ?',
                type
              );
              setCategories(result.map((r) => r.category_name));
              
              Alert.alert('Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  // Edit category
  const handleEditCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditCategoryName(categoryName);
    setShowEditCatModal(true);
  };

  // Update category name
  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim()) {
      Alert.alert('Please enter a category name');
      return;
    }

    if (editCategoryName.trim() === editingCategory) {
      setShowEditCatModal(false);
      return;
    }

    try {
      // Check if new name already exists
      const existing = await db.getFirstAsync<{ category_name: string }>(
        'SELECT category_name FROM category WHERE category_name = ? AND type = ?',
        [editCategoryName.trim(), type]
      );
      
      if (existing) {
        Alert.alert('Category already exists!');
        return;
      }

      // Get all affected expense IDs before updating
      const affectedExpenses = await db.getAllAsync<{ id: number }>(
        'SELECT id FROM expenses WHERE category = ?',
        [editingCategory]
      );

      // Update category name in category table
      await db.runAsync(
        'UPDATE category SET category_name = ? WHERE category_name = ? AND type = ?',
        [editCategoryName.trim(), editingCategory, type]
      );

      // Update category name in expenses table
      await db.runAsync(
        'UPDATE expenses SET category = ? WHERE category = ?',
        [editCategoryName.trim(), editingCategory]
      );

      // Track changes for all affected expenses
      for (const expense of affectedExpenses) {
        await db.runAsync(
          'INSERT INTO expense_changes (action, expense_id, isSynced) VALUES (?, ?, ?)',
          ['edited', expense.id, 0]
        );
      }

      // Update category name in budget table
      await db.runAsync(
        'UPDATE budget SET category = ? WHERE category = ?',
        [editCategoryName.trim(), editingCategory]
      );

      // Refresh categories list
      const result = await db.getAllAsync<{ category_name: string }>(
        'SELECT category_name FROM category WHERE type = ?',
        type
      );
      setCategories(result.map((r) => r.category_name));

      // Update selected category if it was the one being edited
      if (selectedCategory === editingCategory) {
        setSelectedCategory(editCategoryName.trim());
      }

      setShowEditCatModal(false);
      setEditingCategory('');
      setEditCategoryName('');
      setIsDataUpdated(false);
      Alert.alert('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: colors.text }}>
        Update Transaction
      </Text>

      {/* Type Toggle */}
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {['expense', 'income'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setType(item as 'income' | 'expense')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              backgroundColor:
                type === item
                  ? item === 'income'
                    ? '#22c55e'
                    : '#ef4444'
                  : colors.card,
              marginRight: item === 'expense' ? 8 : 0,
            }}
          >
            <Text style={{ textAlign: 'center', color: type === item ? '#fff' : colors.text }}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Selector */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
          backgroundColor: colors.card,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: selectedCategory ? colors.text : '#888' }}>
          {selectedCategory ? `📁 ${selectedCategory}` : '📁 Select Category'}
        </Text>
      </TouchableOpacity>

      {/* Amount Input */}
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={{
          backgroundColor: colors.inputBg,
          color: colors.inputText,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          fontSize: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
      />

      {/* Description */}
      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        style={{
          backgroundColor: colors.inputBg,
          color: colors.inputText,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          fontSize: 16,
          borderWidth: 1,
          borderColor: colors.border,
          height: 80,
        }}
        multiline
        placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
      />

      {/* Time Picker */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{
          backgroundColor: colors.card,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text }}>📅 {date.toLocaleString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, selected) => {
            if (selected) setDate(selected);
            setShowDatePicker(false);
          }}
        />
      )}

      {/* Submit */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.replace('./home')}
          style={{
            flex: 1,
            backgroundColor: colors.btnCancel,
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpdateTransaction}
          style={{
            flex: 1,
            backgroundColor: colors.btnUpdate,
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Update Transaction
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for selecting category */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
          <View
            style={{
              margin: 20,
              backgroundColor: colors.modalBg,
              borderRadius: 16,
              padding: 20,
              maxHeight: '70%',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.modalText }}>
              Select a Category
            </Text>

            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderColor: theme === 'dark' ? '#444' : '#eee',
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(item);
                      setShowModal(false);
                    }}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ fontSize: 16, color: colors.text }}>{item}</Text>
                  </TouchableOpacity>
                  
                  {/* Edit button */}
                  <TouchableOpacity
                    onPress={() => handleEditCategory(item)}
                    style={{
                      padding: 8,
                      marginLeft: 8,
                      borderRadius: 6,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    }}
                  >
                    <Text style={{ color: '#22c55e', fontSize: 16, fontWeight: 'bold' }}>✏️</Text>
                  </TouchableOpacity>
                  
                  {/* Delete button */}
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(item)}
                    style={{
                      padding: 8,
                      marginLeft: 8,
                      borderRadius: 6,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold' }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Add New Category Shortcut */}
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                setTimeout(() => setShowAddCatModal(true), 300);
              }}
              style={{
                marginTop: 12,
                paddingVertical: 10,
                backgroundColor: theme === 'dark' ? '#232323' : '#f3f4f6',
                borderRadius: 10,
              }}
            >
              <Text style={{ textAlign: 'center', color: colors.accent }}>+ Add New Category</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ textAlign: 'center', color: colors.modalCancel }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for new category */}
      <Modal visible={showAddCatModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 20,
          }}
        >
          <View style={{ backgroundColor: colors.modalBg, borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.modalText }}>
              Add New Category
            </Text>
            <TextInput
              placeholder="Category Name"
              value={newCategory}
              onChangeText={setNewCategory}
              style={{
                backgroundColor: colors.inputBg,
                color: colors.inputText,
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
            />
            <TouchableOpacity
              onPress={handleAddCategory}
              style={{
                backgroundColor: colors.btnCat,
                padding: 12,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: colors.btnCatText, textAlign: 'center' }}>Add Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddCatModal(false)}
              style={{ marginTop: 10, alignItems: 'center' }}
            >
              <Text style={{ color: colors.modalCancel }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for editing category */}
      <Modal visible={showEditCatModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 20,
          }}
        >
          <View style={{ backgroundColor: colors.modalBg, borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.modalText }}>
              Edit Category
            </Text>
            <TextInput
              placeholder="Category Name"
              value={editCategoryName}
              onChangeText={setEditCategoryName}
              style={{
                backgroundColor: colors.inputBg,
                color: colors.inputText,
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
              autoFocus
            />
            <TouchableOpacity
              onPress={handleUpdateCategory}
              style={{
                backgroundColor: colors.btnCat,
                padding: 12,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: colors.btnCatText, textAlign: 'center' }}>Update Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowEditCatModal(false);
                setEditingCategory('');
                setEditCategoryName('');
              }}
              style={{ marginTop: 10, alignItems: 'center' }}
            >
              <Text style={{ color: colors.modalCancel }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}