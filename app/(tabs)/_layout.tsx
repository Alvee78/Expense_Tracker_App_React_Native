
import { Stack, useRouter } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";
import { useReducer } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";


export default function TabsLayout() {
  const router = useRouter();
  return <ScreenWrapper>
    <Stack initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="chart" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="settings" />
    </Stack>
  <CustomTabBar onAddPress={() => {router.replace("./addTransection")}} />
  </ScreenWrapper>
}
