import AsyncStorage from "@react-native-async-storage/async-storage";
import { widgetService } from "./widget.service";

const TIMER_KEY = "@active_task_timer";

export interface ActiveTimer {
    taskId: string;
    taskTitle: string;
    estimatedMinutes: number; // parsed from estimatedTime (hours) → minutes
    startedAt: string; // ISO string
    pausedAt?: string | null; // ISO string when the timer was paused, null if running
    totalPausedSeconds: number; // cumulative seconds spent on break
}

export const timerService = {
    async start(timer: Omit<ActiveTimer, 'pausedAt' | 'totalPausedSeconds'>): Promise<void> {
        const full: ActiveTimer = { ...timer, pausedAt: null, totalPausedSeconds: 0 };
        await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(full));
        await widgetService.startLiveActivity(full);
    },

    async stop(): Promise<void> {
        const current = await timerService.get();
        await AsyncStorage.removeItem(TIMER_KEY);
        if (current) await widgetService.stopLiveActivity(current.taskId);
    },

    async pause(): Promise<ActiveTimer | null> {
        const timer = await timerService.get();
        if (!timer || timer.pausedAt) return timer; // already paused or not running
        const updated: ActiveTimer = { ...timer, pausedAt: new Date().toISOString() };
        await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(updated));
        await widgetService.updateLiveActivity(updated);
        return updated;
    },

    async resume(): Promise<ActiveTimer | null> {
        const timer = await timerService.get();
        if (!timer || !timer.pausedAt) return timer; // not paused
        const pauseSeconds = Math.floor(
            (Date.now() - new Date(timer.pausedAt).getTime()) / 1000,
        );
        const updated: ActiveTimer = {
            ...timer,
            pausedAt: null,
            totalPausedSeconds: (timer.totalPausedSeconds ?? 0) + pauseSeconds,
        };
        await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(updated));
        await widgetService.updateLiveActivity(updated);
        return updated;
    },

    async get(): Promise<ActiveTimer | null> {
        const raw = await AsyncStorage.getItem(TIMER_KEY);
        return raw ? (JSON.parse(raw) as ActiveTimer) : null;
    },

    isPaused(timer: ActiveTimer): boolean {
        return !!timer.pausedAt;
    },

    /** Returns elapsed active seconds (excludes paused time). */
    elapsedSeconds(timer: ActiveTimer): number {
        const wallSeconds = Math.floor(
            (Date.now() - new Date(timer.startedAt).getTime()) / 1000,
        );
        // If currently paused, don't count time since pause started
        const currentPause = timer.pausedAt
            ? Math.floor((Date.now() - new Date(timer.pausedAt).getTime()) / 1000)
            : 0;
        return Math.max(0, wallSeconds - (timer.totalPausedSeconds ?? 0) - currentPause);
    },

    /** Returns remaining seconds (can be negative if over-time). */
    remainingSeconds(timer: ActiveTimer): number {
        return timer.estimatedMinutes * 60 - timerService.elapsedSeconds(timer);
    },

    /** Format seconds → "HH:MM:SS" or "MM:SS" */
    format(totalSeconds: number): string {
        const abs = Math.abs(totalSeconds);
        const h = Math.floor(abs / 3600);
        const m = Math.floor((abs % 3600) / 60);
        const s = abs % 60;
        const pad = (n: number) => String(n).padStart(2, "0");
        const base = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
        return totalSeconds < 0 ? `+${base}` : base;
    },
};
