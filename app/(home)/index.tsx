import Loading from '@/components/LoadingScreen';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function Page() {
  const { isLoaded } = useAuth();

  if(!isLoaded) {
    return <Loading />;
  }
  return (
    <>
      <SignedIn>
        <Redirect href="/(tabs)/home"/>
      </SignedIn>
      <SignedOut>
        <Redirect href="./getStarted"/>
      </SignedOut>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#22223b',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2e64e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2e64e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: '#2e64e5',
    fontWeight: '600',
    fontSize: 16,
  },
})