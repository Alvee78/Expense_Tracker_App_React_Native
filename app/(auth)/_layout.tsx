import ScreenWrapper from '@/components/ScreenWrapper'
import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Stack } from 'expo-router'
import React from 'react'

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <Redirect href={'../(home)'} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}