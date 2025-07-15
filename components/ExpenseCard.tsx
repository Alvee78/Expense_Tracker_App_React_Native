import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type ExpenseCardProps = {
  category: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  onLongPress?: () => void;
};

export default function ExpenseCard({ category, amount, description, date, type, onLongPress }: ExpenseCardProps) {
  const { theme, currency } = useTheme();
  const isIncome = type === 'income';
  const color = isIncome ? '#22c55e' : '#ef4444'; // green or red
  const icon = isIncome ? 'arrow-up-circle' : 'arrow-down-circle';

  // Theme-based colors
  const cardBg = theme === 'dark' ? '#18181b' : '#fff';
  const textMain = theme === 'dark' ? '#f3f4f6' : '#333';
  const textSecondary = theme === 'dark' ? '#a1a1aa' : '#666';
  const textDate = theme === 'dark' ? '#6b7280' : '#aaa';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{
        backgroundColor: cardBg,
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
      onLongPress={onLongPress}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left Section */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: textMain }}>{category}</Text>
          <Text style={{ fontSize: 14, color: textSecondary, marginTop: 4 }}>{description}</Text>
          <Text style={{ fontSize: 12, color: textDate, marginTop: 4 }}>{date}</Text>
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
            {isIncome ? '+' : '-'}{currency} {amount.toFixed(2)}
          </Text>
          <Ionicons name={icon} size={24} color={color} style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}