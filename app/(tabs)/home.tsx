import AppText from "@/components/AppText";
import HomeGridLayout from "@/components/layout/HomeGridLayout";
import ListLayout from "@/components/layout/ListLayout";
import {
  AI_TASK_OPTIONS,
  AT_RESPONSE_WAITING_MESSAGES,
} from "@/constants/ai.task.options";
import { aiService } from "@/services/ai.service";
import { taskService } from "@/services/task.service";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [gridView, setGridView] = React.useState(true);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResponse, setAIResponse] = useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  const [aiTask, setAITask] = useState<string | null>(null);
  const [aiWaitingTimeResponse, setAiWaitingTimeResponse] = useState(
    AT_RESPONSE_WAITING_MESSAGES[0],
  );
  const router = useRouter();

  // UI layout changes based on gridView state
  const handleUIChange = (view: "grid" | "list") => {
    setGridView(view === "grid");
  };

  // Fetch tasks from service
  const fetchTasks = React.useCallback(async () => {
    const stored = await taskService.getTasks();
    if (stored) {
      setTasks(stored);
      setFilteredTasks(stored);
    }
  }, []);

  // Refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTasks().finally(() => setRefreshing(false));
  }, [fetchTasks]);

  // Refresh tasks when screen load.
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks]),
  );

  // Handle create task with AI
  const handleCreateTaskWithAI = async (key: string) => {
    setIsGeneratingAI(true);
    let airesponse;
    try {
      const response = await taskService.getTodaysTasks();
      if (response.length > 0) {
        switch (key) {
          case "eod":
            airesponse = await aiService.generateEodSummary(response);
            break;
          case "summery":
            // airesponse = await aiService.generateTaskSummary(response);
            break;
          case "email":
            // airesponse = await aiService.generateEmailSummary(response);
            break;
          default:
            break;
        }
      }
      if (airesponse) {
        setAIResponse(airesponse);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredTasks(tasks);
        return;
      }

      const query = searchQuery.toLowerCase().trim();
      const filtered = tasks.filter((task) => {
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descriptionMatch = task.description?.toLowerCase().includes(query);
        const priorityMatch = task.priority?.toLowerCase().includes(query);
        const statusMatch = task.status?.toLowerCase().includes(query);
        const tagsMatch = task.tags?.some((tag: string) =>
          tag.toLowerCase().includes(query)
        );

        return titleMatch || descriptionMatch || priorityMatch || statusMatch || tagsMatch;
      });

      setFilteredTasks(filtered);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, tasks]);

  useEffect(() => {
    if (isGeneratingAI) {
      setAiWaitingTimeResponse(AT_RESPONSE_WAITING_MESSAGES[0]);
      intervalRef.current = setInterval(() => {
        setAiWaitingTimeResponse(
          AT_RESPONSE_WAITING_MESSAGES[
          Math.floor(Math.random() * AT_RESPONSE_WAITING_MESSAGES.length)
          ],
        );
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isGeneratingAI]);

  return (
    <SafeAreaView className="flex-1 bg-black ">
      <ScrollView
        stickyHeaderIndices={[2]}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="px-5 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Title */}
        <Text className="text-white text-4xl font-bold mb-6">Projects</Text>

        {/* Controls */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row bg-zinc-900 rounded-xl p-1">
            <TouchableOpacity
              className={`p-2 rounded-lg ${gridView ? "bg-zinc-800" : ""}`}
              onPress={() => {
                handleUIChange("grid"),
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={gridView ? "white" : "#71717a"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-2 rounded-lg ${!gridView ? "bg-zinc-800" : ""}`}
              onPress={() => {
                handleUIChange("list"),
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={!gridView ? "white" : "#71717a"}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-row items-center bg-zinc-800 px-4 py-2 rounded-xl"
              onPress={() => {
                router.push("/tasks/create");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="add" size={20} color="white" />
              <AppText className="text-white ml-2 font-medium">
                Create Task
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-11 h-11 bg-lime-400 rounded-xl justify-center items-center"
              onPress={() => {
                setShowAIPrompt(true)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              }
            >
              <Ionicons name="sparkles-outline" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-4 mb-8 border border-zinc-800">
          <Ionicons name="search" size={20} color="#71717a" />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor="#71717a"
            className="flex-1 ml-3 text-white text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>

        {/* To Do Section */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="bg-orange-500/10 px-3 py-1 rounded-lg">
            <AppText className="text-orange-400 font-medium">TODO</AppText>
          </View>
          <TouchableOpacity onPress={() => router.push("/tasks/create")}>
            <Ionicons name="add" size={24} color="#71717a" />
          </TouchableOpacity>
        </View>

        {filteredTasks.length === 0 && searchQuery.length > 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="search-outline" size={48} color="#71717a" />
            <AppText className="text-zinc-500 text-lg mt-4">
              No tasks found for "{searchQuery}"
            </AppText>
          </View>
        ) : gridView ? (
          <HomeGridLayout updates={filteredTasks} />
        ) : (
          <ListLayout updates={filteredTasks} />
        )}

        {/* Next Card Preview */}
        <View className="bg-zinc-900/50 rounded-3xl p-5 border border-zinc-800 border-dashed">
          <AppText className="text-white text-lg font-medium">
            New Hire Onboarding Flow
          </AppText>
          <View className="flex-row gap-2 mt-3">
            <View className="bg-yellow-500/10 px-3 py-1 rounded-lg">
              <AppText className="text-yellow-500 text-xs">HR</AppText>
            </View>
            <View className="bg-zinc-800 px-3 py-1 rounded-lg">
              <AppText className="text-zinc-400 text-xs">Content</AppText>
            </View>
          </View>
          <View className="flex-row items-center mt-4 opacity-50">
            <Ionicons name="calendar-outline" size={16} color="#71717a" />
            <AppText className="text-zinc-500 text-xs ml-2 font-medium">
              21 Nov – 05 Dec 2025
            </AppText>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAIPrompt}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIPrompt(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowAIPrompt(false)}
          />
          <View className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 h-[400px]">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Ionicons name="sparkles" size={24} color="#a3e635" />
                <AppText className="text-white text-xl font-bold ml-2">
                  Generate with AI
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowAIPrompt(false);
                  setAIResponse(null);
                  setAITask(null);
                  setIsCopied(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="close-circle" size={28} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              {aiResponse ? (
                <TouchableOpacity
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await Clipboard.setStringAsync(aiResponse);
                    setIsCopied(true);
                    setTimeout(() => {
                      setIsCopied(false);
                    }, 2000);
                  }}
                  className="flex-row items-center"
                >
                  <Ionicons name="copy-outline" size={20} color="#71717a" />
                  <AppText className="text-zinc-400 ml-2">
                    {isCopied ? "Copied!" : "Click to copy"}
                  </AppText>
                </TouchableOpacity>
              ) : (
                <AppText className="text-zinc-400 mb-4">
                  Choose options to generate ✨
                </AppText>
              )}
            </View>

            {!aiResponse && (
              <Animated.View className="flex-1 mb-4">
                {AI_TASK_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    className="flex-row items-center mb-4"
                    onPress={() => setAITask(option.key)}
                  >
                    <AppText className="text-white text-sm font-bold ml-2 bg-zinc-800 px-4 py-2 rounded-full">
                      {`${option.title}`}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {aiResponse && (
              <Animated.View
                style={[{ borderWidth: 2, borderRadius: 16 }]}
                className="bg-zinc-950 flex-1 mb-4 p-4"
              >
                <AppText className="text-white text-sm font-bold">
                  {aiResponse}
                </AppText>
              </Animated.View>
            )}
            {isGeneratingAI && (
              <View className="mb-4 flex-row items-center justify-center">
                <AppText className="text-white/50 text-sm font-bold">
                  {aiWaitingTimeResponse}
                </AppText>
              </View>
            )}
            {!aiResponse && (
              <TouchableOpacity
                className={`bg-lime-400 w-full rounded-2xl py-4 items-center flex-row justify-center ${isGeneratingAI ? "opacity-50" : ""}`}
                onPress={() => {
                  if (aiTask) {
                    handleCreateTaskWithAI(aiTask);
                  } else {
                    Alert.alert("Please select an option");
                  }
                }}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <AppText className="text-black text-lg font-bold ml-2">
                    Generating...
                  </AppText>
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={24} color="black" />
                    <AppText className="text-black text-lg font-bold ml-2">
                      Generate With AI
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
