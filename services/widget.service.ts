import { NativeModules, Platform } from "react-native";
import { ActiveTimer } from "./timer.service";

const APP_GROUP = "group.com.worktracker.task";

interface WidgetTask {
    id: string;
    title: string;
    priority: string;
    status: string;
}

// ── Live Activity state shape (mirrors TaskTimerAttributes.ContentState) ──────

interface LiveActivityState {
    startedAt: string;
    estimatedSeconds: number;
    totalPausedSeconds: number;
    pausedAt: string;           // "" when running, ISO string when paused
    statusLabel: string;        // "In Progress" | "On Break" | "Overtime"
}

function timerToLiveActivityState(timer: ActiveTimer): LiveActivityState {
    const elapsedMs = Date.now() - new Date(timer.startedAt).getTime();
    const elapsedSecs = Math.floor(elapsedMs / 1000);
    const remaining = timer.estimatedMinutes * 60 - elapsedSecs;

    let statusLabel: string;
    if (timer.pausedAt) {
        statusLabel = "On Break";
    } else if (remaining < 0) {
        statusLabel = "Overtime";
    } else {
        statusLabel = "In Progress";
    }

    return {
        startedAt: timer.startedAt,
        estimatedSeconds: timer.estimatedMinutes * 60,
        totalPausedSeconds: timer.totalPausedSeconds ?? 0,
        pausedAt: timer.pausedAt ?? "",
        statusLabel,
    };
}

/**
 * Writes today's tasks to the iOS shared App Group UserDefaults
 * so the WidgetKit widget can read and display them, and manages
 * the Live Activity for an active task timer (Dynamic Island + Lock Screen).
 */
export const widgetService = {

    // ─── WidgetKit task sync ────────────────────────────────────────────────

    async syncTasksToWidget(tasks: WidgetTask[]): Promise<void> {
        if (Platform.OS !== "ios") return;

        const SharedGroupPreferences = NativeModules.SharedGroupPreferences;
        if (!SharedGroupPreferences) return;

        try {
            const data = JSON.stringify(tasks);
            // Write task data
            await SharedGroupPreferences.setItem("widgetTasks", data, APP_GROUP);
            // Bump the timestamp so WidgetKit knows data changed → triggers
            // an immediate timeline reload from the widget side.
            await SharedGroupPreferences.setItem(
                "widgetLastUpdate",
                new Date().toISOString(),
                APP_GROUP,
            );
        } catch (error) {
            console.error("Failed to sync tasks to widget:", error);
        }
    },

    // ─── Live Activity ──────────────────────────────────────────────────────

    async startLiveActivity(timer: ActiveTimer): Promise<void> {
        if (Platform.OS !== "ios") return;
        const bridge = NativeModules.LiveActivityBridge;
        if (!bridge) return;
        try {
            await bridge.start(timer.taskId, timer.taskTitle, timerToLiveActivityState(timer));
        } catch (e) {
            console.warn("LiveActivity start failed:", e);
        }
    },

    async updateLiveActivity(timer: ActiveTimer): Promise<void> {
        if (Platform.OS !== "ios") return;
        const bridge = NativeModules.LiveActivityBridge;
        if (!bridge) return;
        try {
            await bridge.update(timer.taskId, timerToLiveActivityState(timer));
        } catch (e) {
            console.warn("LiveActivity update failed:", e);
        }
    },

    async stopLiveActivity(taskId: string): Promise<void> {
        if (Platform.OS !== "ios") return;
        const bridge = NativeModules.LiveActivityBridge;
        if (!bridge) return;
        try {
            await bridge.stop(taskId);
        } catch (e) {
            console.warn("LiveActivity stop failed:", e);
        }
    },
};
