import { NativeModules, Platform } from "react-native";

const APP_GROUP = "group.com.worktracker.shared";

interface WidgetTask {
    id: string;
    title: string;
    priority: string;
    status: string;
}

/**
 * Writes today's tasks to the iOS shared App Group UserDefaults
 * so the WidgetKit widget can read and display them.
 */
export const widgetService = {
    async syncTasksToWidget(tasks: WidgetTask[]): Promise<void> {
        if (Platform.OS !== "ios") return;

        try {
            const SharedGroupPreferences =
                NativeModules.SharedGroupPreferences;

            if (!SharedGroupPreferences) {
                console.warn(
                    "SharedGroupPreferences native module not available. Widget sync skipped."
                );
                return;
            }

            const data = JSON.stringify(tasks);
            await SharedGroupPreferences.setItem(
                "widgetTasks",
                data,
                APP_GROUP
            );
        } catch (error) {
            console.error("Failed to sync tasks to widget:", error);
        }
    },
};
