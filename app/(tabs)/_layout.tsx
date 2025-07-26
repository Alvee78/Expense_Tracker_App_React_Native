
import Loading from "@/components/LoadingScreen";
import TabScreenWrapper from "@/components/TabScreenWrapper";
import { useTheme } from "@/context/ThemeContext";
import { fetchAndStoreUserData, syncAll } from "@/services/server";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import { Stack, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import CustomTabBar from "../../components/CustomTabBar";

export default function TabsLayout() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { isDataUpdated, setIsDataUpdated } = useTheme();
  const [emailAddress, setEmailAddress] = useState("");
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchEmail = async () => {
      const storedEmail = user?.primaryEmailAddress?.emailAddress || "";
      setEmailAddress(storedEmail || "");
      await AsyncStorage.getItem('userDataFetched').then((value) => {
        if (value === 'false') {
          setIsLoading(true);
          while(isLoading) {
            fetchAndStoreUserData(db, emailAddress).then((value) => {
              if(value.success) {
                AsyncStorage.setItem('userDataFetched', 'true');
                setIsLoading(false);
              }
            });
          }
        } else {
          setIsLoading(false);
        }
      });
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
  
  
  return isLoading?<Loading/>:<TabScreenWrapper>
    <Stack initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="chart" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="settings" />
    </Stack>
  <CustomTabBar onAddPress={() => {router.replace("./addTransection")}} />
  </TabScreenWrapper>
}
