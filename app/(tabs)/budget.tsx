import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
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

export default function BudgetScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const colors = theme === 'dark'
    ? {
        background: '#18181b',
        card: '#1e1e21ff',
        text: '#ffffff',
        border: '#444',
        subtitle: '#ddddf9ff',
        progressColor: '#417731ff',
        progressBg: '#ffffffff',
        iconCircleBg: '#2b323eff',
        addBtnBg: '#90a789ff',
        addBtnText: '#fff',
      }
    : {
        background: '#ffffff',
        card: '#fffbeb',
        text: '#000000ff',
        border: '#fbbf24',
        subtitle: '#92400e',
        progressColor: '#b45309',
        progressBg: '#fef3c7',
        iconCircleBg: '#fde68a',
        addBtnBg: '#f59e0b',
        addBtnText: '#000',
      };

  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchBudgetData();
    const unsubscribe = navigation.addListener('focus', fetchBudgetData);
    return unsubscribe;
  }, []);

  const fetchBudgetData = async () => {
    try {
      const result = await db.getAllAsync(
        `SELECT b.id, b.category, b.amount AS budget,
         IFNULL(SUM(e.amount), 0) AS expenses
         FROM budget b
         LEFT JOIN expenses e ON b.category = e.category AND e.type = 'expense'
         GROUP BY b.id`
      );
      setBudgetData(result);
    } catch (error) {
      console.error('❌ Failed to fetch budget data:', error);
    }
  };

  const handleSaveBudget = async () => {
    if (!newCategory.trim() || !newAmount.trim()) {
      alert('Please enter both category and amount');
      return;
    }
    if (isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      alert('Please enter a valid amount greater than zero');
      return;
    }

    try {
      if (isEditing && editingId !== null) {
        await db.runAsync(
          'UPDATE budget SET category = ?, amount = ? WHERE id = ?',
          [newCategory.trim(), Number(newAmount), editingId]
        );
      } else {
        await db.runAsync(
          'INSERT INTO budget (category, amount) VALUES (?, ?)',
          [newCategory.trim(), Number(newAmount)]
        );
      }

      setNewCategory('');
      setNewAmount('');
      setShowAddForm(false);
      setIsEditing(false);
      setEditingId(null);
      fetchBudgetData();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM budget WHERE id = ?', [id]);
              fetchBudgetData();
            } catch (error) {
              console.error('❌ Error deleting budget:', error);
              alert('Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: any }) => {
    const remaining = item.budget - item.expenses;
    const percentage = item.budget > 0 ? remaining / item.budget : 0;
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
              <Ionicons name="create-outline" size={20} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.budgetInfoRow}>
          <Progress.Circle
            size={60}
            progress={percentage}
            showsText
            formatText={() => `Remaining\n${Math.round(percentage * 100)}%`}
            color={colors.progressColor}
            unfilledColor={colors.progressBg}
            thickness={5}
            borderWidth={1}
            textStyle={{ fontSize: 9, textAlign: 'center', color: colors.text }}
          />
          <View style={styles.details}>
            <Text style={[styles.label, { color: colors.subtitle }]}>
              Remaining: <Text style={[styles.value, { color: colors.text }]}>{remaining.toLocaleString()}</Text>
            </Text>
            <Text style={[styles.label, { color: colors.subtitle }]}>
              Budget: <Text style={[styles.value, { color: colors.text }]}>{item.budget.toLocaleString()}</Text>
            </Text>
            <Text style={[styles.label, { color: colors.subtitle }]}>
              Expenses: <Text style={[styles.value, { color: colors.text }]}>{item.expenses.toLocaleString()}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Budget</Text>
        <TouchableOpacity onPress={() => setShowCalendar(true)}>
          <Text style={[styles.month, { color: colors.text }]}>
            {selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })} ▼
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgetData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategory}
        contentContainerStyle={{ paddingBottom: 180 }}
      />

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

      {showAddForm && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => {
              setShowAddForm(false);
              setIsEditing(false);
              setEditingId(null);
            }}
          />
          <View style={styles.centeredContainer}>
            <View style={[styles.addFormContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Budget' : 'Add New Budget'}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Category"
                placeholderTextColor={colors.subtitle}
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Amount"
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
                  onPress={() => {
                    setShowAddForm(false);
                    setIsEditing(false);
                    setEditingId(null);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {showCalendar && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={(event, date) => {
            setShowCalendar(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: { fontSize: 22, fontWeight: 'bold' },
  month: { fontSize: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: { fontSize: 16, fontWeight: '600' },
  actionBtns: { flexDirection: 'row', alignItems: 'center' },
  budgetInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  details: { marginLeft: 16 },
  label: { fontSize: 14 },
  value: { fontWeight: '600' },
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  addBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
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
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#f87171',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
