import AppText from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();

  const userStats = [
    { label: "Projects", value: "12" },
    { label: "Tasks", value: "145" },
    { label: "Hours", value: "320" },
  ];

  const menuItems = [
    { icon: "person-outline", label: "Account Settings", route: "/account" },
    {
      icon: "notifications-outline",
      label: "Notifications",
      route: "/notifications",
    },
    { icon: "card-outline", label: "Billing & Payment", route: "/billing" },
    { icon: "shield-checkmark-outline", label: "Security", route: "/security" },
    { icon: "help-circle-outline", label: "Help & Support", route: "/support" },
    {
      icon: "log-out-outline",
      label: "Log Out",
      route: "/logout",
      color: "#FF453A",
    },
  ];

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header Section */}
        <View className="items-center relative mb-6">
          <LinearGradient
            colors={["#FF8C00", "#FF4500", "transparent"]}
            className="absolute top-0 w-full h-[300px] opacity-20"
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <View className="w-full flex-row justify-end items-center px-6 pt-12 z-10">
            <TouchableOpacity className="h-10 w-10 bg-white/10 rounded-full items-center justify-center backdrop-blur-md">
              <Ionicons name="settings-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center mt-10">
            <View className="relative">
              <LinearGradient
                colors={["#FF8C00", "#FF4500"]}
                className="absolute -inset-1 rounded-full opacity-80"
              />
              <Image
                source={{
                  uri: "https://img.freepik.com/premium-photo/game-developer-cartoon-character-3d-animation-illustration-guide_1029473-45128.jpg?semt=ais_hybrid&w=740&q=80",
                }}
                className="w-28 h-28 rounded-full border-4 border-black"
              />
            </View>
            <AppText className="text-white text-2xl font-bold mt-4">
              Junaid
            </AppText>
            <AppText className="text-gray-400 text-sm">
              Software Engineer
            </AppText>
            <AppText className="text-gray-500 text-xs">
              Towner Solution Pvt. Ltd.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
