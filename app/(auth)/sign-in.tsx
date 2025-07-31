import { useTheme } from '@/context/ThemeContext';
import { fetchAndStoreUserData } from '@/services/server';
import { useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';

export default function Page() {
  const db = useSQLiteContext();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Improved grey-based light theme
  const colors = theme === 'dark'
    ? {
        bg: '#18181b',
        card: '#232323',
        border: '#fde047',
        title: '#fde047',
        inputBg: '#232323',
        inputText: '#fde047',
        button: '#fde047',
        buttonText: '#18181b',
        link: '#fde047',
        text: '#fde047',
      }
    : {
        bg: '#f3f4f6',        // light grey background
        card: '#e5e7eb',      // grey card
        border: '#e5e7eb',    // subtle grey border
        title: '#22c55e',     // green accent for title
        inputBg: '#fff',      // white input
        inputText: '#18181b', // dark text
        button: '#22c55e',    // green button
        buttonText: '#fff',   // white button text
        link: '#22c55e',      // green link
        text: '#18181b',      // dark text
      };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        await AsyncStorage.setItem('userDataFetched', 'false'); // Reset flag
        await fetchAndStoreUserData(db,emailAddress);
        router.replace('/');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        Alert.alert('Sign In Failed', 'Unable to complete sign in. Please try again.');
      }
    } catch (err: any) {
      
      // Show user-friendly error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err?.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  // Fetch and store user data from the server
// Updated fetchAndStoreUserData function


  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.formWrapper, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.title }]}>Sign in</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={setPassword}
          placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
        />
      {isLoading?<View style={[styles.button, { backgroundColor: colors.button }]}>
        <ActivityIndicator size="small" color={colors.buttonText} />
      </View>:<TouchableOpacity style={[styles.button, { backgroundColor: colors.button }]} onPress={onSignInPress}>
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>Continue</Text>
      </TouchableOpacity>}
        <View style={styles.row}>
          <Text style={[styles.text, { color: colors.text }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/sign-up')}>
            <Text style={[styles.link, { color: colors.link }]}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrapper: {
    borderRadius: 30,
    borderWidth: 1,
    paddingVertical: verticalScale(32),
    paddingHorizontal: verticalScale(24),
    width: '90%',
    alignItems: 'center',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: scale(32),
    fontWeight: '700',
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: verticalScale(14),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderRadius: verticalScale(8),
    fontSize: scale(16),
  },
  button: {
    paddingVertical: verticalScale(14),
    borderRadius: verticalScale(8),
    marginBottom: verticalScale(18),
    alignItems: 'center',
    width: '100%',
    marginTop: verticalScale(8),
    height: verticalScale(45),
  },
  buttonText: {
    fontWeight: '600',
    fontSize: scale(18),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  text: {
    fontSize: scale(15),
  },
  link: {
    fontWeight: '600',
    fontSize: scale(15),
    marginLeft: scale(4),
  },
});