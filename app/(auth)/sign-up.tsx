import { useSignUp } from '@clerk/clerk-expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import * as React from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { scale, verticalScale } from 'react-native-size-matters'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [fullName, setFullName] = React.useState('');
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return
    if( !emailAddress || !password || !fullName) {
      Alert.alert('Please fill in all fields');
      return;
    }
    await AsyncStorage.setItem('userName', fullName);
    try {
      await signUp.create({
        emailAddress,
        password,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.formWrapper}>
          <Text style={styles.title}>Verify your email</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter your verification code"
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity style={styles.button} onPress={onVerifyPress}>
            <Text style={styles.buttonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.formWrapper}>
        <Text style={styles.title}>Sign up</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          placeholder="Enter your name"
          onChangeText={setFullName}
          keyboardType='default'
          placeholderTextColor="#6b7280"
        />  
       
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          placeholderTextColor="#6b7280"
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={setPassword}
          placeholderTextColor="#6b7280"
        />
        <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={styles.text}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/sign-in')}>
            <Text style={styles.link}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrapper: {
    backgroundColor: '#f8f8f8ff',
    borderRadius: 30,
    borderColor: '#22c55e',
    borderWidth: 1,
    paddingVertical: verticalScale(32),
    paddingHorizontal: verticalScale(24),
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: verticalScale(14),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: scale(16),
    color: '#22223b',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: verticalScale(14),
    borderRadius: 8,
    marginBottom: verticalScale(18),
    alignItems: 'center',
    width: '100%',
    marginTop: verticalScale(8),
  },
  buttonText: {
    color: '#fff',
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
    color: '#22223b',
  },
  link: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: scale(15),
  },
});