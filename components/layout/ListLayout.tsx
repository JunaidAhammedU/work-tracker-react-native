import { formatHumanDateTime } from "@/services/date.helper";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import AppText from "../AppText";

interface Update {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string[];
  dueDate: string | null;
  estimatedTime: string;
  createdAt: string;
}

interface ListLayoutProps {
  updates: Update[];
}

export default function ListLayout({ updates }: ListLayoutProps) {
  return (
    <View className="gap-3 mb-10">
      {updates.map((update, idx) => (
        <View
          key={update.id || idx}
          className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              <AppText
                className="text-white text-base font-semibold mr-2"
                numberOfLines={1}
              >
                {update.title}
              </AppText>
              <View className="bg-red-500/10 px-2 py-0.5 rounded">
                <AppText className="text-red-500 text-[10px] font-bold">
                  {update.priority}
                </AppText>
              </View>
            </View>

            <AppText className="text-lime-400 text-sm mb-2" numberOfLines={1}>
              {update.description}
            </AppText>

            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={12} color="#71717a" />
                <AppText className="text-zinc-500 text-xs ml-1 font-medium">
                  {formatHumanDateTime(
                    update.createdAt || new Date().toString(),
                  )}
                </AppText>
              </View>
              {update.tags.length > 0 && (
                <View className="bg-zinc-800 px-2 py-0.5 rounded">
                  <AppText className="text-zinc-400 text-[10px]">
                    {update.tags[0]}{" "}
                    {update.tags.length > 1 ? `+${update.tags.length - 1}` : ""}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
