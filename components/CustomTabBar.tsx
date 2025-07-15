import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { verticalScale } from "react-native-size-matters";

type Props = {
  onAddPress: () => void;
};

const tabColors = {
  light: {
    bar: "#fff",
    iconActive: "#2563EB",
    iconInactive: "#888",
    addBg: "#2563EB",
    addText: "#fff",
    shadow: "#000",
  },
  dark: {
    bar: "#111827",
    iconActive: "#fff",
    iconInactive: "#888",
    addBg: "#2563EB",
    addText: "#fff",
    shadow: "#000",
  },
};

export default function CustomTabBar({ onAddPress }: Props) {
  const { theme } = useTheme();
  const colors = tabColors[theme];
  const router = useRouter();
  const segments = useSegments();
  const current = `/${segments[segments.length - 1] || "home"}`;

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.bar, shadowColor: colors.shadow }]}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./home")}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={current === "/home" ? colors.iconActive : colors.iconInactive}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./chart")}
      >
        <Ionicons
          name="stats-chart-outline"
          size={24}
          color={current === "/chart" ? colors.iconActive : colors.iconInactive}
        />
      </TouchableOpacity>

      {/* Center + icon */}
      <TouchableOpacity
        style={[styles.tabItem, styles.addButton, { backgroundColor: colors.addBg }]}
        onPress={onAddPress}
      >
        <Text style={[styles.addText, { color: colors.addText }]}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./budget")}
      >
        <Ionicons
          name="wallet-outline"
          size={24}
          color={current === "/budget" ? colors.iconActive : colors.iconInactive}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./settings")}
      >
        <Ionicons
          name="settings-outline"
          size={24}
          color={current === "/settings" ? colors.iconActive : colors.iconInactive}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: verticalScale(20),
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    fontSize: 32,
    lineHeight: 50,
    textAlign: "center",
  },
});