import ActiveTaskTimer from "@/components/ActiveTaskTimer";
import AppText from "@/components/AppText";
import { getPriorityColor, getStatusColor } from "@/components/Helper";
import { formatHumanDateTime } from "@/services/date.helper";
import { taskService } from "@/services/task.service";
import { ActiveTimer, timerService } from "@/services/timer.service";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TaskDetails {
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

export default function ViewSpecific() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [taskDetails, setTaskDetails] = React.useState<TaskDetails | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [isCopied, setIsCopied] = React.useState(false);
  const [activeTimer, setActiveTimer] = React.useState<ActiveTimer | null>(null);
  const router = useRouter();

  const fetchTaskDetails = React.useCallback(async () => {
    setLoading(true);
    const response = await taskService.getTaskById(taskId);
    if (response) {
      setTaskDetails(response);
    }
    setLoading(false);
  }, [taskId]);

  // Refresh tasks when screen load.
  useFocusEffect(
    useCallback(() => {
      fetchTaskDetails();
      timerService.get().then((t) => {
        // Only show the timer if it belongs to this task
        setActiveTimer(t?.taskId === taskId ? t : null);
      });
    }, [fetchTaskDetails]),
  );

  const handleStartWork = async () => {
    const existing = await timerService.get();
    if (existing && existing.taskId !== taskId) {
      Alert.alert(
        "Timer Already Running",
        `"${existing.taskTitle}" is already in progress. Stop it first before starting a new one.`,
      );
      return;
    }
    if (!taskDetails) return;
    const estimatedMinutes = taskDetails.estimatedTime
      ? Math.round(parseFloat(taskDetails.estimatedTime) * 60)
      : 0;
    const timer: ActiveTimer = {
      taskId: taskDetails.id,
      taskTitle: taskDetails.title,
      estimatedMinutes,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      totalPausedSeconds: 0,
    };
    await timerService.start(timer);
    setActiveTimer(timer);
  };

  const handleBreak = async () => {
    const updated = await timerService.pause();
    if (updated) setActiveTimer({ ...updated });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#a3e635" />
      </SafeAreaView>
    );
  }

  if (!taskDetails) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center px-5">
        <View className="bg-zinc-900 rounded-2xl p-8 items-center border border-zinc-800">
          <Ionicons name="alert-circle-outline" size={48} color="#71717a" />
          <AppText className="text-white text-lg font-bold mt-4">
            Task Not Found
          </AppText>
          <AppText className="text-zinc-500 text-center mt-2">
            The task you're looking for doesn't exist or has been deleted.
          </AppText>
          <TouchableOpacity
            className="bg-lime-400 px-6 py-3 rounded-xl mt-6"
            onPress={() => router.back()}
          >
            <AppText className="text-black font-bold">Go Back</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // share option.
  const shareTask = async () => {
    try {
      await Share.share({
        title: `📝 Task: ${taskDetails.title}`,
        message: `📝 *${taskDetails.title}*

🗒️ Description: ${taskDetails.description || "No description"}
🏷️ Priority: ${taskDetails.priority}
📊 Status: ${taskDetails.status}
📅 Due Date: ${taskDetails.dueDate ? formatHumanDateTime(taskDetails.dueDate) : "Not set"}
⏱️ Estimated Time: ${taskDetails.estimatedTime ? `${taskDetails.estimatedTime} hr${Number(taskDetails.estimatedTime) > 1 ? "s" : ""}` : "Not set"}

🔗 #WorkTrackerApp`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // copy to clipboard option.
  const copyTaskDetails = async () => {
    const taskInfo =
      `📝 Task: ${taskDetails.title}\n\n` +
      `Description: ${taskDetails.description || "No description"}\n` +
      `Priority: ${taskDetails.priority}\n` +
      `Status: ${taskDetails.status}\n` +
      `Due Date: ${taskDetails.dueDate ? formatHumanDateTime(taskDetails.dueDate) : "Not set"}\n` +
      `Estimated Time: ${taskDetails.estimatedTime ? `${taskDetails.estimatedTime} hr${Number(taskDetails.estimatedTime) > 1 ? "s" : ""}` : "Not set"}`;

    await Clipboard.setStringAsync(taskInfo);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // delete task option.
  const handleDelete = async () => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).then(
              confirmDelete,
            );
          },
        },
      ],
    );
  };

  // confirm delete action.
  const confirmDelete = async () => {
    await taskService.deleteTask(taskDetails.id);
    Alert.alert("Task Deleted", "The task has been successfully deleted.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const priorityColors = getPriorityColor(taskDetails.priority);
  const statusColors = getStatusColor(taskDetails.status);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 py-4 border-b border-zinc-900 mb-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="w-11 h-11 bg-zinc-900 rounded-xl justify-center items-center border border-zinc-800"
                onPress={() => router.push(`/tasks/edit?taskId=${taskId}`)}
              >
                <Ionicons name="pencil" size={20} color="white" />
              </TouchableOpacity>
              {activeTimer ? (
                <TouchableOpacity
                  className="h-11 px-4 bg-lime-400/10 rounded-xl justify-center items-center border border-lime-400/40 flex-row gap-2"
                  onPress={handleBreak}
                >
                  <Ionicons name="pause-circle-outline" size={18} color="#a3e635" />
                  <AppText className="text-lime-400 text-sm font-semibold">Break</AppText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="h-11 px-4 bg-lime-400 rounded-xl justify-center items-center flex-row gap-2"
                  onPress={handleStartWork}
                >
                  <Ionicons name="play" size={18} color="black" />
                  <AppText className="text-black text-sm font-bold">Start</AppText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          {/* Priority & Status Badges */}
          <View className="flex-row gap-3 mb-4">
            <View
              className={`${priorityColors.bg} px-4 py-2 rounded-xl border ${priorityColors.border}`}
            >
              <AppText className={`${priorityColors.text} text-sm font-bold`}>
                {taskDetails.priority}
              </AppText>
            </View>
            <View
              className={`${statusColors.bg} px-4 py-2 rounded-xl border ${statusColors.border}`}
            >
              <AppText className={`${statusColors.text} text-sm font-bold`}>
                {taskDetails.status}
              </AppText>
            </View>
          </View>

          {/* Title */}
          <AppText className="text-white text-3xl font-bold leading-tight mb-2">
            {taskDetails.title}
          </AppText>

          {/* ID Badge */}
          <View className="flex-row items-center">
            <Ionicons name="finger-print-outline" size={14} color="#71717a" />
            <AppText className="text-zinc-500 text-xs ml-1">
              #{taskDetails.id}
            </AppText>
          </View>
        </View>

        {/* Active Timer Card for this task */}
        {activeTimer && (
          <View className="mx-5 mb-4">
            <ActiveTaskTimer
              timer={activeTimer}
              onStop={() => setActiveTimer(null)}
            />
          </View>
        )}

        {/* Description Card */}
        <View className="mx-5 mb-4">
          <View className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#a3e635"
              />
              <AppText className="text-white text-base font-bold ml-2">
                Description
              </AppText>
            </View>
            <AppText className="text-zinc-300 text-base leading-relaxed">
              {taskDetails.description || "No description provided."}
            </AppText>
          </View>
        </View>

        {/* Tags */}
        {taskDetails.tags && taskDetails.tags.length > 0 && (
          <View className="mx-5 mb-4">
            <View className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <View className="flex-row items-center mb-3">
                <Ionicons name="pricetags-outline" size={18} color="#a3e635" />
                <AppText className="text-white text-base font-bold ml-2">
                  Tags
                </AppText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {taskDetails.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-zinc-800 px-4 py-2 rounded-xl"
                  >
                    <AppText className="text-zinc-300 text-sm">{tag}</AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Details Grid */}
        <View className="mx-5 mb-4">
          <View className="flex-row gap-3">
            {/* Due Date */}
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <View className="w-10 h-10 bg-lime-400/10 rounded-xl justify-center items-center mb-3">
                <Ionicons name="calendar" size={20} color="#a3e635" />
              </View>
              <AppText className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                Due Date
              </AppText>
              <AppText className="text-white text-sm font-bold">
                {taskDetails.dueDate
                  ? formatHumanDateTime(taskDetails.dueDate)
                  : "Not set"}
              </AppText>
            </View>

            {/* Estimated Time */}
            <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <View className="w-10 h-10 bg-lime-400/10 rounded-xl justify-center items-center mb-3">
                <Ionicons name="time" size={20} color="#a3e635" />
              </View>
              <AppText className="text-zinc-500 text-xs uppercase tracking-wider mb-1">
                Estimated
              </AppText>
              <AppText className="text-white text-sm font-bold">
                {taskDetails.estimatedTime
                  ? `${taskDetails.estimatedTime} hr${Number(taskDetails.estimatedTime) > 1 ? "s" : ""}`
                  : "Not set"}
              </AppText>
            </View>
          </View>
        </View>

        {/* Created At */}
        <View className="mx-5 mb-4">
          <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-lime-400/10 rounded-xl justify-center items-center">
                <Ionicons name="create-outline" size={20} color="#a3e635" />
              </View>
              <View className="ml-4">
                <AppText className="text-zinc-500 text-xs uppercase tracking-wider">
                  Created At
                </AppText>
                <AppText className="text-white text-sm font-bold mt-1">
                  {formatHumanDateTime(taskDetails.createdAt)}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mx-5 mt-4">
          <AppText className="text-zinc-500 text-xs uppercase tracking-wider mb-3 ml-1">
            Quick Actions
          </AppText>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800 items-center"
              onPress={shareTask}
            >
              <Ionicons name="share-outline" size={22} color="#71717a" />
              <AppText className="text-zinc-400 text-sm mt-2">Share</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800 items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                copyTaskDetails();
              }}
            >
              <Ionicons name="copy-outline" size={22} color="#71717a" />
              <AppText
                className={`${isCopied ? "text-lime-400 text-sm mt-2" : "text-zinc-400 text-sm mt-2"}`}
              >
                {isCopied ? "Copied" : "Copy"}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-500/10 rounded-2xl p-4 border border-red-500/30 items-center"
              onPress={() => handleDelete()}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <AppText className="text-red-500 text-sm mt-2">Delete</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
