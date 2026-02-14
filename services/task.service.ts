import { storage } from "./storage";

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

export const taskService = {
  // Fetch all tasks.
  async getTasks(): Promise<Task[]> {
    const tasks = await storage.get<Task[]>(STORAGE_KEY);
    return tasks || [];
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
  },

  // Delete a task by ID.
  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const updatedTasks = tasks.filter((t) => t.id !== id);
    await storage.set(STORAGE_KEY, updatedTasks);
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
