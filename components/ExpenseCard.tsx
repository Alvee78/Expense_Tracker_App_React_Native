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

  // Improved theme colors
  const colors = theme === 'dark'
    ? {
        cardBg: '#232323',
        textMain: '#fde047',      // yellow-300
        textSecondary: '#a1a1aa',
        textDate: '#b45309',      // amber-700
        icon: isIncome ? '#22c55e' : '#ef4444',
      }
    : {
        cardBg: '#e5e7eb',        // grey card
        textMain: '#18181b',      // dark text
        textSecondary: '#6b7280', // medium grey
        textDate: '#6b7280',      // medium grey for date
        icon: isIncome ? '#22c55e' : '#ef4444', // green/red accent
      };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{
        backgroundColor: colors.cardBg,
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
        <View style={{ width: '70%' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textMain }}>{category}</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{description}</Text>
          <Text style={{ fontSize: 12, color: colors.textDate, marginTop: 4 }}>{date}</Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.icon,
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
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.icon }}>
            {isIncome ? '+' : '-'}{currency} {amount.toFixed(2)}
          </Text>
          <Ionicons name={isIncome ? 'arrow-up-circle' : 'arrow-down-circle'} size={24} color={colors.icon} style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}