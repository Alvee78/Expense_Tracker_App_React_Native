import { useTheme } from '@/context/ThemeContext'
import { saveUser } from '@/services/server'
import { useSignUp } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import * as React from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { scale, verticalScale } from 'react-native-size-matters'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const { theme } = useTheme()
  const [fullName, setFullName] = React.useState('');
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false);

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

  // Handle submission of sign-up form
  const onSignUpPress = async () => {

    if (!isLoaded) return
    if (!emailAddress || !password || !fullName) {
      Alert.alert('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    await AsyncStorage.setItem('userName', fullName);
    try {
      await signUp.create({
        emailAddress,
        password,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      
      // Show user-friendly error message
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err?.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Sign Up Error', errorMessage);
    }finally {
      setIsLoading(false);
    }

  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return
    setIsLoading(true);
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        await saveUser(fullName, emailAddress);
        router.replace('/');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
        Alert.alert('Verification Failed', 'Unable to verify your email. Please check your code and try again.');
      }
    } catch (err: any) {
      
      // Show user-friendly error message
      let errorMessage = 'Verification failed. Please try again.';
      
      if (err?.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Verification Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.formWrapper, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.title }]}>Verify your email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
            value={code}
            placeholder="Enter your verification code"
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
          />
          {isLoading ? (
            <View style={[styles.button, { backgroundColor: colors.button }]}>
              <ActivityIndicator size="small" color={colors.buttonText} />
            </View>
          ) : (
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.button }]} onPress={onVerifyPress}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.formWrapper, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.title }]}>Sign up</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.border }]}
          value={fullName}
          placeholder="Enter your name"
          onChangeText={setFullName}
          keyboardType='default'
          placeholderTextColor={theme === 'dark' ? '#a1a1aa' : '#888'}
        />
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
        {isLoading ? (
          <View style={[styles.button, { backgroundColor: colors.button }]}>
            <ActivityIndicator size="small" color={colors.buttonText} />
          </View>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.button }]} onPress={onSignUpPress}>
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Continue</Text>
          </TouchableOpacity>
        )}

        <View style={styles.row}>
          <Text style={[styles.text, { color: colors.text }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/sign-in')}>
            <Text style={[styles.link, { color: colors.link }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
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
    maxWidth: 400,
    alignItems: 'center',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: verticalScale(14),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderRadius: 8,
    fontSize: scale(16),
  },
  button: {
    height: verticalScale(50),
    paddingVertical: verticalScale(14),
    borderRadius: 8,
    marginBottom: verticalScale(18),
    alignItems: 'center',
    width: '100%',
    marginTop: verticalScale(8),
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