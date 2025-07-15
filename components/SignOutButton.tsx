import { useClerk } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface SignOutButtonProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SignOutButton = ({ style, textStyle }: SignOutButtonProps) => {
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    try {
      await signOut();
      Linking.openURL(Linking.createURL('(home)'));
    } catch (err) {
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