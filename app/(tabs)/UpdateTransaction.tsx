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

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      Alert.alert('Transaction updated!');
      router.replace('./home');
    } catch (e) {
      console.error(e);
      Alert.alert('Update failed');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
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
                  : '#e5e7eb',
              marginRight: item === 'expense' ? 8 : 0,
            }}
          >
            <Text style={{ textAlign: 'center', color: type === item ? '#fff' : '#000' }}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Selector */}
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

      {/* Submit */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.replace('./home')}
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
          onPress={handleUpdateTransaction}
          style={{
            flex: 1,
            backgroundColor: '#6366f1',
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
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ textAlign: 'center', color: '#ef4444' }}>Cancel</Text>
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
