import { useSignIn } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { scale, verticalScale } from 'react-native-size-matters'

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.formWrapper}>
        <Text style={styles.title}>Sign in</Text>
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
        <TouchableOpacity style={styles.button} onPress={onSignInPress}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={styles.text}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/sign-up')}>
            <Text style={styles.link}>Sign up</Text>
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
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: scale(32),
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: verticalScale(14),
    marginBottom: verticalScale(18),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: verticalScale(8),
    backgroundColor: '#fff',
    fontSize: scale(16),
    color: '#22223b',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: verticalScale(14),
    borderRadius: verticalScale(8),
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
    marginLeft: scale(4),
  },
});