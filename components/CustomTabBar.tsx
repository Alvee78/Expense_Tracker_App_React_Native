import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { verticalScale } from "react-native-size-matters";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onAddPress: () => void;
};

export default function CustomTabBar({ onAddPress }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const current = `/${segments[segments.length - 1] || "home"}`;

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./home")}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={current === "/home" ? "#fff" : "#888"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./chart")}
      >
        <Ionicons
          name="stats-chart-outline"
          size={24}
          color={current === "/chart" ? "#fff" : "#888"}
        />
      </TouchableOpacity>

      {/* Center + icon */}
      <TouchableOpacity
        style={[styles.tabItem, styles.addButton]}
        onPress={onAddPress}  // Trigger modal open here
      >
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./budget")}
      >
        <Ionicons
          name="calendar-outline"
          size={24}
          color={current === "/budget" ? "#fff" : "#888"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("./settings")}
      >
        <Ionicons
          name="settings-outline"
          size={24}
          color={current === "/settings" ? "#fff" : "#888"}
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
    backgroundColor: "#111827",
    borderRadius: 30,
    shadowColor: "#000",
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
    backgroundColor: "#2563EB",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 50,
    textAlign: "center",
  },
});
