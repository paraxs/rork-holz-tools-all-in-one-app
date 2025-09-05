import { Tabs } from "expo-router";
import { Calculator, Ruler } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4CAF50",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
        },
      }}
    >
      <Tabs.Screen
        name="festmeter"
        options={{
          title: "Festmeter",
          tabBarIcon: ({ color }) => <Calculator color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="balken"
        options={{
          title: "Balken-Stamm",
          tabBarIcon: ({ color }) => <Ruler color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}