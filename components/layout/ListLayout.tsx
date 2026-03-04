import { formatHumanDateTime } from "@/services/date.helper";
import { taskService } from "@/services/task.service";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import AppText from "../AppText";
import TaskStatusDropdown from "../task-status-dropdown";

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
  onStartWork?: (task: Update) => void;
  onBreak?: (task: Update) => void;
}

export default function ListLayout({ updates, onStartWork, onBreak }: ListLayoutProps) {
  // keep a local copy so we can update status inline and force
  // component re-render without depending on parent to refresh the
  // array reference
  const [localUpdates, setLocalUpdates] = React.useState<Update[]>(updates);

  React.useEffect(() => {
    setLocalUpdates(updates);
  }, [updates]);

  const handleStatusChange = async (task: Update, newStatus: string) => {
    try {
      const updatedTask = { ...task, status: newStatus };
      await taskService.updateTask(updatedTask);
      setLocalUpdates((prev) =>
        prev.map((u) => (u.id === task.id ? { ...u, status: newStatus } : u)),
      );
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  return (
    <View className="gap-3 mb-10">
      {localUpdates.map((update, idx) => (
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
              {/* inline status dropdown */}
              <TaskStatusDropdown
                value={update.status}
                onChange={(s) => handleStatusChange(update, s)}
                onStartWork={() => onStartWork?.(update)}
                onBreak={() => onBreak?.(update)}
              />
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
