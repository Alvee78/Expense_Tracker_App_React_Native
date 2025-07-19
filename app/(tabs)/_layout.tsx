
import TabScreenWrapper from "@/components/TabScreenWrapper";
import { Stack, useRouter } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";
import { useSQLiteContext } from "expo-sqlite";
import { use, useEffect, useState } from "react";
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from "@/context/ThemeContext";
import { syncAll } from "@/services/server";
import { useUser } from "@clerk/clerk-expo";

export default function TabsLayout() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { isDataUpdated, setIsDataUpdated } = useTheme();
  const [emailAddress, setEmailAddress] = useState("");
  const { user } = useUser();
  useEffect(() => {
    const fetchEmail = async () => {
      const storedEmail = user?.primaryEmailAddress?.emailAddress || "";
      setEmailAddress(storedEmail || "");
    }
    fetchEmail();
    processTransactionForServer();
  }, [user]);

  useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(async state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      console.log('Now online');
      // Do sync process
      if (emailAddress.length > 0) {
        await syncAll(db, emailAddress);
      }
      setIsDataUpdated(true);
    } else {
      console.log('Now offline');
    }
  });

  return () => {
    unsubscribe();
  };
}, [isDataUpdated, db]);

  const processTransactionForServer = async () => {
    const changes = await db.getAllAsync('SELECT * FROM expense_changes');
    const expenses = await db.getAllAsync('SELECT * FROM expenses');
    console.log('expense_changes table:', changes);
    console.log('expenses table:', expenses);
  }
  
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
