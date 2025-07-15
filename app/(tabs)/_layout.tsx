
import TabScreenWrapper from "@/components/TabScreenWrapper";
import { Stack, useRouter } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";

export default function TabsLayout() {
  const router = useRouter();
  return <TabScreenWrapper>
    <Stack initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="chart" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="settings" />
    </Stack>
  <CustomTabBar onAddPress={() => {router.replace("./addTransection")}} />
  </TabScreenWrapper>
}
