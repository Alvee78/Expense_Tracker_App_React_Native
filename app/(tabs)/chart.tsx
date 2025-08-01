import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { verticalScale } from 'react-native-size-matters';

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
  
  // Add state for month/year selection
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

  const colors = useMemo(() => {
    return theme === 'dark'
      ? { 
          bg: '#18181b', 
          card: '#27272a', 
          text: '#fde047', 
          border: '#444', 
          subtitle: '#a1a1aa',
          modalBg: '#27272a',
          modalText: '#fde047',
          icon: '#fde047'
        }
      : { 
          bg: '#f9fafb', 
          card: '#fff', 
          text: '#222', 
          border: '#e5e7eb', 
          subtitle: '#6b7280',
          modalBg: '#fff',
          modalText: '#222',
          icon: '#222'
        };
  }, [theme]);

  // Updated loadData function with date filtering
  const loadData = async () => {
    // Format month and year for SQLite date comparison
    const monthStr = (selectedMonth + 1).toString().padStart(2, '0'); // SQLite months are 1-12
    const yearStr = selectedYear.toString();
    const monthYearStr = `${yearStr}-${monthStr}`;

    console.log(`📊 Loading chart data for ${monthNames[selectedMonth]} ${selectedYear}`);
    console.log(`📊 Filtering by month-year: ${monthYearStr}`);

    const result = await db.getAllAsync<{ category: string; amount: number }>(
      `SELECT category, SUM(amount) as amount
       FROM expenses
       WHERE type = 'expense' AND strftime('%Y-%m', created_at) = ?
       GROUP BY category ORDER BY amount DESC`,
      [monthYearStr]
    );

    console.log(`📊 Found ${result.length} categories with expenses for ${monthNames[selectedMonth]} ${selectedYear}:`, result);

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

  useEffect(() => {
    loadData();
  }, [db, theme, colors.text, selectedMonth, selectedYear]); // Re-fetch when month/year changes

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

      
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          {pieData.length > 0 ? (<PieChart
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
          />) : (
        <Text style={[styles.noDataText, { color: colors.subtitle }]}>
          No expense data for {monthNames[selectedMonth]} {selectedYear}.
        </Text>
      )}
      <View style={styles.dateSelectionContainer}>
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
      </View>
      
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }, { marginTop: 12 }]}>Expense Breakdown</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={ListHeader}
        style={[styles.flatListStyle, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.flatListContentContainer,
          { paddingBottom: 100 },
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
                        selectedMonth === index && { 
                          backgroundColor: '#22c55e' + '30'
                        }
                      ]}
                      onPress={() => {
                        console.log('Month selected:', index, monthNames[index]);
                        setSelectedMonth(index);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { 
                          color: selectedMonth === index ? '#22c55e' : colors.modalText,
                          fontWeight: selectedMonth === index ? 'bold' : 'normal'
                        }
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
                        selectedYear === year && { 
                          backgroundColor: '#22c55e' + '30'
                        }
                      ]}
                      onPress={() => {
                        console.log('Year selected:', year);
                        setSelectedYear(year);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { 
                          color: selectedYear === year ? '#22c55e' : colors.modalText,
                          fontWeight: selectedYear === year ? 'bold' : 'normal'
                        }
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
                style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListStyle: {
    flex: 1,
  },
  flatListContentContainer: {
    padding: 20,
  },
  
  // Date Selection Styles
  dateSelectionContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: verticalScale(10),
    marginRight: 20,
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

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  chartContainer: {
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
    borderWidth: 1,
    borderColor: 'transparent',
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
});