import { useTheme } from '@/context/ThemeContext';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

type CategoryData = {
  name: string;
  amount: number;
  color: string;
};

const COLORS = [
  '#facc15', 
  '#38bdf8',
  '#fda4af',
  '#34d399', 
  '#a3e635',
  '#f87171', 
  '#c084fc', 
];

export default function ChartPage() {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const [data, setData] = useState<CategoryData[]>([]);
  const [total, setTotal] = useState(0);

  const colors = useMemo(() => {
    return theme === 'dark'
      ? { bg: '#18181b', card: '#27272a', text: '#fde047', border: '#444', subtitle: '#a1a1aa' }
      : { bg: '#f9fafb', card: '#fff', text: '#222', border: '#e5e7eb', subtitle: '#6b7280' };
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      const result = await db.getAllAsync<{ category: string; amount: number }>(
        `SELECT category, SUM(amount) as amount
         FROM expenses
         WHERE type = 'expense'
         GROUP BY category ORDER BY amount DESC`
      );

      const totalAmount = result.reduce((sum, r) => sum + r.amount, 0);
      const chartData = result.map((item, index) => ({
        name: item.category,
        amount: item.amount,
        color: COLORS[index % COLORS.length],
        legendFontColor: colors.text,
        legendFontSize: 14,
      }));

      setData(chartData);
      setTotal(totalAmount);
    };

    loadData();
  }, [db, theme, colors.text]);

  const pieData = useMemo(() => {
    return data.map((item) => ({
      name: item.name,
      amount: item.amount,
      color: item.color,
      legendFontColor: colors.text,
      legendFontSize: 14,
    }));
  }, [data, colors.text]);

  const chartConfig = useMemo(() => {
    return {
      color: (opacity = 1) => colors.text,
    };
  }, [colors.text]);

  const ListHeader = () => (
    <View>
      <Text style={[styles.title, { color: colors.text }]}> Expense Breakdown</Text>

      {pieData.length > 0 ? (
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={240}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            hasLegend={true}
            absolute={false}
            style={{ borderRadius: 16 }}
          />
        </View>
      ) : (
        <Text style={[styles.noDataText, { color: colors.subtitle }]}>No expense data to display chart.</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.name}
      ListHeaderComponent={ListHeader}
      style={[styles.flatListStyle, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.flatListContentContainer,
        { paddingBottom: 100 }, // 👈 Fix for navigation bar hiding last item
      ]}
      renderItem={({ item }) => {
        const percentage = ((item.amount / total) * 100).toFixed(2);
        return (
          <View style={[styles.row, { backgroundColor: colors.card, shadowColor: theme === 'dark' ? '#000' : '#000' }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowText}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.percentage, { color: colors.subtitle }]}>{percentage}%</Text>
                <Text style={[styles.amount, { color: colors.text }]}>${item.amount.toLocaleString()}</Text>
              </View>
              <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percentage}%` as ViewStyle['width'],
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  flatListStyle: {
    flex: 1,
  },
  flatListContentContainer: {
    padding: 20,
    // paddingBottom: 100 is added directly in component above
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginVertical: 10,
    borderRadius: 16,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 8,
    padding: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rowText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 8,
  },
  percentage: {
    fontSize: 14,
    marginRight: 6,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 'auto',
  },
  barBackground: {
    height: 6,
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
