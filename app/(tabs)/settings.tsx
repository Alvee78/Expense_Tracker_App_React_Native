import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@clerk/clerk-expo';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { verticalScale } from 'react-native-size-matters';
import SignOutButton from '../../components/SignOutButton';

const currencyOptions = [
  { label: '৳ Bangladeshi Taka', value: '৳' },
  { label: '$ US Dollar', value: '$' },
  { label: '₹ Indian Rupee', value: '₹' },
  { label: '€ Euro', value: '€' },
  { label: '£ British Pound', value: '£' },
];

const Settings = () => {
  const { theme, toggleTheme, currency, setCurrency } = useTheme();
  const [userName, setUserName] = useState('John Doe');
  const [showModal, setShowModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [userEmail, setUserEmail] = useState('example@example.com');
  const { user } = useUser();

  // Improved color palette
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        card: '#232323',
        text: '#fde047', // yellow-300
        border: '#444',
        subtitle: '#a1a1aa',
        accent: '#fde047',
      }
    : {
        bg: '#fffde7', // very light yellow
        card: '#fff9c4', // soft yellow for cards
        text: '#18181b',
        border: '#fde047', // yellow border
        subtitle: '#b45309', // amber-700
        accent: '#b45309',
      };

  const handleChangeUserName = async () => {
    const trimmedUserName = newUserName.trim();
    if (trimmedUserName) {
      setUserName(trimmedUserName);
      setShowModal(false);
      setNewUserName('');
      await AsyncStorage.setItem('userName', trimmedUserName);
    }
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const storedUserName = await AsyncStorage.getItem('userName');
      setUserName(storedUserName || 'John Doe');
      if (user) {
        setUserEmail(user.primaryEmailAddress?.emailAddress || 'example@example.com');
      }
    };
    fetchUserName();
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Profile Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={require('../../assets/images/avatar.png')}
          style={styles.avatar}
        />
        <Text style={[styles.header, { color: colors.text }]}>Settings</Text>
      </View>
      <ScrollView style={{ marginBottom: verticalScale(50) }}>
        {/* User Info Card */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MaterialIcons name="person" size={24} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.label, { color: colors.text }]}>User Name</Text>
              <Text style={[styles.value, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.subtitle, { color: colors.subtitle }]}>This is your display name.</Text>
            </View>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: colors.accent }]}
              onPress={() => setShowModal(true)}
            >
              <Feather name="edit-2" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Currency Picker Card */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border, height: verticalScale(110) }]}>
          <View style={styles.row}>
            <MaterialIcons name="attach-money" size={24} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.label, { color: colors.text }]}>Currency</Text>
              <Text style={[styles.subtitle, { color: colors.subtitle }]}>Select your preferred currency.</Text>
              <Picker
                selectedValue={currency}
                onValueChange={setCurrency}
                style={{ color: colors.text, backgroundColor: colors.card, marginTop: 4 }}
                dropdownIconColor={colors.text}
              >
                {currencyOptions.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Dark Mode Toggle */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Feather name="moon" size={24} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.subtitle, { color: colors.subtitle }]}>Switch between light and dark theme.</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              thumbColor={theme === 'dark' ? colors.accent : '#fff'}
              trackColor={{ false: '#e5e7eb', true: colors.accent }}
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Other Info */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MaterialIcons name="email" size={24} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <Text style={[styles.value, { color: colors.text }]}>{userEmail}</Text>
              <Text style={[styles.subtitle, { color: colors.subtitle }]}>Your registered email address.</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={{ marginTop: 32 }}>
          <SignOutButton style={{
              height: verticalScale(45),
              width: '100%',
              backgroundColor: colors.accent,
              borderColor: colors.accent
            }} textStyle={{ color: theme === 'dark' ? '#18181b' : '#fff' }} />
        </View>
      </ScrollView>
      {/* Change Username Modal */}
      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>Enter new username</Text>
            <TextInput
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="New username"
              placeholderTextColor={colors.border}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#6b7280' }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                onPress={handleChangeUserName}
              >
                <Text style={{ color: theme === 'dark' ? '#18181b' : '#fff', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 18,
    height: verticalScale(120),
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 0,
    borderWidth: 1,
    elevation: 2,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  editBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor:'transparent',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 18,
    backgroundColor: 'transparent',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    borderRadius: 14,
    padding: 22,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutButton: {
    height: verticalScale(45),
    width: '100%',
    
  },
});