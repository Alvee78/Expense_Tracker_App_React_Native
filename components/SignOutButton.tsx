import { useClerk } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface SignOutButtonProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SignOutButton = ({ style, textStyle }: SignOutButtonProps) => {
  const { signOut } = useClerk();
  const db = useSQLiteContext();

  const handleSignOut = async () => {
    try {
      // Clear tables before sign out
      await db.runAsync('DELETE FROM expenses');
      await db.runAsync('DELETE FROM category');
      await db.runAsync('DELETE FROM budget');
      await db.runAsync('DELETE FROM expense_changes');
      // Add 15 initial categories
      const categories = [
        ['Food', 'expense'],
        ['Transport', 'expense'],
        ['Shopping', 'expense'],
        ['Entertainment', 'expense'],
        ['Bills', 'expense'],
        ['Education', 'expense'],
        ['Health', 'expense'],
        ['Gifts', 'expense'],
        ['Subscriptions', 'expense'],
        ['Travel', 'expense'],
        ['Salary', 'income'],
        ['Freelance', 'income'],
        ['Investment', 'income'],
        ['Refunds', 'income'],
        ['Others', 'expense']
      ];

      for (const [name, type] of categories) {
        await db.runAsync(
          'INSERT INTO category (category_name, type) VALUES (?, ?)',
          name, type
        );
      }
      await signOut();
      Linking.openURL(Linking.createURL('(home)'));
    } catch (err) {
      Alert.alert('Error', 'Failed to clear data or sign out.');
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleSignOut}>
      <Text style={[styles.buttonText, textStyle]}>Sign out</Text>
    </TouchableOpacity>
  );
};

export default SignOutButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2e64e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 18,
    width: 180,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#2e64e5',
    fontWeight: '600',
    fontSize: 16,
  },
});