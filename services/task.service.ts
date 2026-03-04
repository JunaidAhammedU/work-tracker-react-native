import { storage } from "./storage";
import { widgetService } from "./widget.service";

// convert any legacy values stored by earlier versions of the app
// so that all code can assume the new standardized status strings.
function normalizeStatus(status: string): string {
  switch (status) {
    case "todo":
      return "Pending";
    case "inprogress":
      return "In Progress";
    case "done":
      return "Completed";
    default:
      return status;
  }
}

export interface Task {
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

const STORAGE_KEY = "tasks";

/**
 * Syncs today's tasks to the iOS widget via shared App Group UserDefaults.
 */
async function syncWidgetData(tasks: Task[]) {
  const today = new Date().toISOString().split("T")[0];
  const todaysTasks = tasks.filter(
    (t) => t.createdAt.split("T")[0] === today
  );
  const widgetTasks = todaysTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
  }));
  await widgetService.syncTasksToWidget(widgetTasks);
}

export const taskService = {
  // Fetch all tasks.
  async getTasks(): Promise<Task[]> {
    const tasks = (await storage.get<Task[]>(STORAGE_KEY)) || [];

    // normalize any legacy status values that may have been stored before
    // we aligned all status strings.  This keeps the database consistent
    // and prevents the dropdown from rendering empty values.
    const normalized = tasks.map((t) => ({
      ...t,
      status: normalizeStatus(t.status),
    }));

    // if anything changed, write back to storage so the fix is permanent
    const changed = JSON.stringify(normalized) !== JSON.stringify(tasks);
    if (changed) {
      await storage.set(STORAGE_KEY, normalized);
      await syncWidgetData(normalized);
    }

    return normalized;
  },

  // Fetch a single task by ID.
  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.getTasks();
    const task = tasks.find((t) => t.id === id);
    return task || null;
  },

  // Create a new task.
  async createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    await storage.set(STORAGE_KEY, updatedTasks);
    await syncWidgetData(updatedTasks);
    return newTask;
  },

  // Update an existing task.
  async updateTask(updatedTask: Task): Promise<void> {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === updatedTask.id);
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    tasks[taskIndex] = updatedTask;
    await storage.set(STORAGE_KEY, tasks);
    await syncWidgetData(tasks);
  },

  // Delete a task by ID.
  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const updatedTasks = tasks.filter((t) => t.id !== id);
    await storage.set(STORAGE_KEY, updatedTasks);
    await syncWidgetData(updatedTasks);
  },

  // Get todays tasks.
  async getTodaysTasks(): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter(
      (t) =>
        t.createdAt.split("T")[0] === new Date().toISOString().split("T")[0] &&
        t.status === "Completed",
    );
  },
};
