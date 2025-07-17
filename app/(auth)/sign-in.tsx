import Loading from '@/components/LoadingScreen';
import { useTheme } from '@/context/ThemeContext';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Theme colors
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
        bg: '#fffde7', // light yellow
        card: '#fff9c4', // soft yellow
        border: '#fde047', // yellow border
        title: '#b45309', // amber-700
        inputBg: '#fff',
        inputText: '#18181b',
        button: '#fde047', // yellow button
        buttonText: '#18181b',
        link: '#b45309',
        text: '#18181b',
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
        router.replace('/');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };


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
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.button }]} onPress={onSignInPress}>
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Continue</Text>
        </TouchableOpacity>
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