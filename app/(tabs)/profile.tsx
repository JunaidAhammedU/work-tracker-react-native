import AppText from "@/components/AppText";
import { GEMINI_MODELS, GeminiModel } from "@/constants/gemini.models";
import { modelStorage } from "@/services/storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [modelPickerVisible, setModelPickerVisible] = useState(false);

  useEffect(() => {
    modelStorage.getSelectedModel().then(setSelectedModel);
  }, []);

  const handleSelectModel = useCallback(async (model: GeminiModel) => {
    await modelStorage.setSelectedModel(model.id);
    setSelectedModel(model.id);
    setModelPickerVisible(false);
  }, []);

  const currentModel = GEMINI_MODELS.find((m) => m.id === selectedModel);

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

        {/* AI Model Selector */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="sparkles-outline" size={18} color="#FF8C00" />
            <AppText className="text-white text-base font-semibold">
              AI Model
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setModelPickerVisible(true)}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <View className="flex-1 mr-3">
              <AppText className="text-white font-semibold text-sm">
                {currentModel?.label ?? "Select a model"}
              </AppText>
              <AppText className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                {currentModel?.description ?? "Tap to choose a Gemini model"}
              </AppText>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-orange-500/20 px-2 py-0.5 rounded-full">
                <AppText className="text-orange-400 text-xs font-medium">Free</AppText>
              </View>
              <Ionicons name="chevron-down" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Model Picker Modal */}
      <Modal
        visible={modelPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModelPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60"
          activeOpacity={1}
          onPress={() => setModelPickerVisible(false)}
        />
        <View
          className="bg-[#111111] rounded-t-3xl border-t border-white/10"
          style={{ maxHeight: "70%" }}
        >
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
            <View className="flex-row items-center gap-2">
              <Ionicons name="sparkles" size={18} color="#FF8C00" />
              <AppText className="text-white font-bold text-lg">
                Select Gemini Model
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => setModelPickerVisible(false)}
              className="h-8 w-8 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <AppText className="text-gray-500 text-xs px-5 pt-3 pb-1">
            All models are free tier. Switch models if you hit a rate limit.
          </AppText>

          <FlatList
            data={GEMINI_MODELS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedModel;
              return (
                <TouchableOpacity
                  onPress={() => handleSelectModel(item)}
                  activeOpacity={0.7}
                  className={`rounded-2xl p-4 flex-row items-center justify-between border ${isSelected
                      ? "bg-orange-500/15 border-orange-500/50"
                      : "bg-white/5 border-white/10"
                    }`}
                >
                  <View className="flex-1 mr-3">
                    <AppText
                      className={`font-semibold text-sm ${isSelected ? "text-orange-400" : "text-white"
                        }`}
                    >
                      {item.label}
                    </AppText>
                    <AppText className="text-gray-400 text-xs mt-0.5" numberOfLines={2}>
                      {item.description}
                    </AppText>
                  </View>
                  {isSelected && (
                    <View className="h-6 w-6 bg-orange-500 rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

