import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DatabaseService } from '../../services/DatabaseService';

export default function AddTransactionPage() {
  const db = useSQLiteContext();
  const dbService = new DatabaseService(db);
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);


  // Fetch categories from DB
  useEffect(() => {
    async function fetchCategories() {
      const result = await db.getAllAsync<{ category_name: string }>(
        'SELECT category_name FROM category WHERE type = ?',
        type
      );
      setCategories(result.map((r) => r.category_name));
    }

    fetchCategories();
  }, [type, showModal]);

  // Insert transaction
  const handleAddTransaction = async () => {
    if (!selectedCategory || !amount) {
      Alert.alert('Please select a category and enter an amount');
      return;
    }

    try {
      await db.runAsync(
        'INSERT INTO expenses (category, amount, type, description, created_at) VALUES (?, ?, ?, ?, ?)',
        selectedCategory,
        parseFloat(amount),
        type,
        description,
        format(date, 'yyyy-MM-dd HH:mm:ss')
      );
      Alert.alert('Transaction added!');
      setAmount('');
      setDescription('');
      setSelectedCategory('');
      setDate(new Date());
    } catch (e) {
      console.error(e);
      Alert.alert('Error adding transaction');
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory) return;

      // Check if category already exists
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
    setShowModal(false);
    Alert.alert('Category added');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Add Transaction</Text>

      {/* Type Switch */}
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {['expense', 'income'].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setType(item as 'income' | 'expense')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              backgroundColor: type === item ? (item === 'income' ? '#22c55e' : '#ef4444') : '#e5e7eb',
              marginRight: item === 'expense' ? 8 : 0,
            }}
          >
            <Text style={{ textAlign: 'center', color: type === item ? '#fff' : '#000' }}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Picker */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
            backgroundColor: '#fff',
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#ddd',
        }}
        >
        <Text style={{ color: selectedCategory ? '#000' : '#888' }}>
            {selectedCategory ? `📁 ${selectedCategory}` : '📁 Select Category'}
        </Text>
        </TouchableOpacity>



      {/* Amount Input */}
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={inputStyle}
      />

      {/* Description */}
      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        style={[inputStyle, { height: 80 }]}
        multiline
      />

      {/* Time Picker */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#ddd',
        }}
      >
        <Text style={{ color: '#000' }}>📅 {date.toLocaleString()}</Text>
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


      {/* Submit and Cancel Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => {
            // Reset form and navigate back
            setAmount('');
            setDescription('');
            setSelectedCategory('');
            setDate(new Date());
            router.replace('./home');
          }}
          style={{
            flex: 1,
            backgroundColor: '#6b7280',
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Cancel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleAddTransaction}
          style={{
            flex: 1,
            backgroundColor: '#6366f1',
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Add Transaction
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for category selection */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
            <View
            style={{
                margin: 20,
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                maxHeight: '70%',
            }}
            >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                Select a Category
            </Text>

            <FlatList
                data={categories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => {
                    setSelectedCategory(item);
                    setShowModal(false);
                    }}
                    style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderColor: '#eee',
                    }}
                >
                    <Text style={{ fontSize: 16 }}>{item}</Text>
                </TouchableOpacity>
                )}
            />

            {/* Add New Category Shortcut */}
            <TouchableOpacity
                onPress={() => {
                setTimeout(() => setShowAddCatModal(true), 300);
                }}
                style={{
                marginTop: 12,
                paddingVertical: 10,
                backgroundColor: '#f3f4f6',
                borderRadius: 10,
                }}
            >
                <Text style={{ textAlign: 'center', color: '#3b82f6' }}>+ Add New Category</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 10 }}>
                <Text style={{ textAlign: 'center', color: '#ef4444' }}>Cancel</Text>
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
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              Add New Category
            </Text>
            <TextInput
              placeholder="Category Name"
              value={newCategory}
              onChangeText={setNewCategory}
              style={inputStyle}
            />
            <TouchableOpacity
              onPress={() => { handleAddCategory(); setShowAddCatModal(false); }}
              style={{
                backgroundColor: '#10b981',
                padding: 12,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Add Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddCatModal(false)}
              style={{ marginTop: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#ef4444' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
  fontSize: 16,
};
