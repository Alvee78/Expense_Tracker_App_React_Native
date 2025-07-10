import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ExpenseCardProps = {
  category: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
};

export default function ExpenseCard({ category, amount, description, date, type }: ExpenseCardProps) {
  const isIncome = type === 'income';
  const color = isIncome ? '#22c55e' : '#ef4444'; // green or red
  const icon = isIncome ? 'arrow-up-circle' : 'arrow-down-circle';

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left Section */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{category}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{description}</Text>
          <Text style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{date}</Text>
          <Text
            style={{
              fontSize: 12,
              color,
              marginTop: 4,
              fontWeight: 'bold',
              textTransform: 'capitalize',
            }}
          >
            {type}
          </Text>
        </View>

        {/* Right Section */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color }}>
            {isIncome ? '+' : '-'}৳ {amount.toFixed(2)}
          </Text>
          <Ionicons name={icon} size={24} color={color} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}
