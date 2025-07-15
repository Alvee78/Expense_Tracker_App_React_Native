import SignOutButton from '@/components/SignOutButton';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@clerk/clerk-expo';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { verticalScale } from 'react-native-size-matters';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('John Doe');
  const [showModal, setShowModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [userEmail, setUserEmail] = useState('example@example.com');
  const { user } = useUser();

  const colors = theme === 'dark'
    ? { bg: '#18181b', card: '#27272a', text: '#fff', border: '#444', subtitle: '#a1a1aa' }
    : { bg: '#f9fafb', card: '#fff', text: '#222', border: '#e5e7eb', subtitle: '#6b7280' };

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
          source={require('@/assets/images/avatar.png')}
          style={styles.avatar}
        />
        <Text style={[styles.header, { color: colors.text }]}>Settings</Text>
      </View>

      {/* User Info Card */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <MaterialIcons name="person" size={24} color={colors.subtitle} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.label, { color: colors.text }]}>User Name</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userName}</Text>
            <Text style={[styles.subtitle, { color: colors.subtitle }]}>This is your display name.</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setShowModal(true)}
          >
            <Feather name="edit-2" size={18} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Dark Mode Toggle */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Feather name="moon" size={24} color={colors.subtitle} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
            <Text style={[styles.subtitle, { color: colors.subtitle }]}>Switch between light and dark theme.</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            thumbColor={theme === 'dark' ? '#6366f1' : '#fff'}
            trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
            style={{ marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Other Info */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <MaterialIcons name="email" size={24} color={colors.subtitle} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>{userEmail}</Text>
            <Text style={[styles.subtitle, { color: colors.subtitle }]}>Your registered email address.</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <View style={{ marginTop: 32 }}>
        <SignOutButton style={styles.signOutButton} textStyle={{ color: '#fff' }} />
      </View>

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
                style={[styles.modalBtn, { backgroundColor: '#6366f1' }]}
                onPress={handleChangeUserName}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
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
    height: verticalScale(100),
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
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    height: verticalScale(45),
    width: '100%',
  },
});