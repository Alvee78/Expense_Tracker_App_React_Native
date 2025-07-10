
import { Stack, useRouter } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";
import { useReducer } from "react";


export default function TabsLayout() {
  const router = useRouter();
  return <>
    <Stack initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="chart" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="settings" />
    </Stack>
  <CustomTabBar onAddPress={() => {router.replace("./addTransection")}} />
  </>
}
