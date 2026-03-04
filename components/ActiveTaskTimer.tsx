import AppText from "@/components/AppText";
import { ActiveTimer, timerService } from "@/services/timer.service";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

interface ActiveTaskTimerProps {
    timer: ActiveTimer;
    onStop: () => void;
    onTimerUpdate?: (updated: ActiveTimer) => void;
}

export default function ActiveTaskTimer({ timer, onStop, onTimerUpdate }: ActiveTaskTimerProps) {
    const router = useRouter();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Local mutable copy of the timer so pause/resume updates re-render without
    // needing the parent to refetch from storage.
    const [localTimer, setLocalTimer] = useState<ActiveTimer>(timer);
    const isPaused = timerService.isPaused(localTimer);

    const [elapsed, setElapsed] = useState(timerService.elapsedSeconds(localTimer));
    // Break duration in seconds — counts up while paused
    const [breakElapsed, setBreakElapsed] = useState(0);

    const remaining = localTimer.estimatedMinutes * 60 - elapsed;
    const isOvertime = remaining < 0;

    // Animated pulse for the live dot
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(1);
    // Animated progress bar (0 → 1)
    const progress = useSharedValue(0);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.4, { duration: 700, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) }),
            ),
            -1,
            true,
        );
        pulseOpacity.value = withRepeat(
            withSequence(withTiming(0.3, { duration: 700 }), withTiming(1, { duration: 700 })),
            -1,
            true,
        );
    }, [pulseOpacity, pulseScale]);

    // Main tick — pauses when timer is on break
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (!isPaused) {
            setBreakElapsed(0);
            intervalRef.current = setInterval(() => {
                setElapsed(timerService.elapsedSeconds(localTimer));
            }, 1000);
        } else {
            // Count break time
            intervalRef.current = setInterval(() => {
                setBreakElapsed((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPaused, localTimer]);

    // Animate progress bar
    useEffect(() => {
        if (localTimer.estimatedMinutes === 0) return;
        const ratio = Math.min(elapsed / (localTimer.estimatedMinutes * 60), 1);
        progress.value = withTiming(ratio, { duration: 800 });
    }, [elapsed, progress, localTimer.estimatedMinutes]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const handleBreak = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const updated = await timerService.pause();
        if (updated) {
            setLocalTimer(updated);
            onTimerUpdate?.(updated);
        }
    };

    const handleResume = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const updated = await timerService.resume();
        if (updated) {
            setLocalTimer(updated);
            onTimerUpdate?.(updated);
            // Re-sync elapsed immediately after resuming
            setElapsed(timerService.elapsedSeconds(updated));
        }
    };

    const handleStop = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await timerService.stop();
        onStop();
    };

    const remainingFormatted = timerService.format(Math.abs(remaining));
    const elapsedFormatted = timerService.format(elapsed);
    const breakFormatted = timerService.format(breakElapsed);

    // Card border / accent colours shift to amber while on break
    const accentBorder = isPaused ? "border-amber-400/40" : "border-lime-400/30";
    const accentLine = isPaused ? "bg-amber-400/60" : "bg-lime-400/60";
    const statusLabel = isPaused ? "On Break" : "In Progress";
    const statusColor = isPaused ? "text-amber-400" : "text-lime-400";
    const dotColor = isPaused ? "bg-amber-400" : "bg-lime-400";

    return (
        <View
            className={`mx-0 mb-6 rounded-3xl overflow-hidden border ${accentBorder}`}
            style={{ backgroundColor: isPaused ? "#1a1400" : "#0a1a0a" }}
        >
            {/* Top accent line */}
            <View className={`h-0.5 ${accentLine}`} />

            <View className="p-5">
                {/* Header row */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-2">
                        {/* Status dot */}
                        <View className="w-5 h-5 items-center justify-center">
                            <View className={`w-3 h-3 rounded-full ${dotColor} absolute`} style={{ opacity: 0.3 }} />
                            <Animated.View className={`w-2 h-2 rounded-full ${dotColor}`} style={isPaused ? undefined : pulseStyle} />
                        </View>
                        <AppText className={`${statusColor} text-xs font-bold uppercase tracking-widest`}>
                            {statusLabel}
                        </AppText>
                    </View>

                    <View className="flex-row items-center gap-2">
                        {/* Navigate to task */}
                        <TouchableOpacity
                            onPress={() => router.push(`/tasks/${localTimer.taskId}`)}
                            className="w-8 h-8 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700"
                        >
                            <Ionicons name="arrow-forward" size={14} color="#a1a1aa" />
                        </TouchableOpacity>

                        {/* Break / Resume toggle */}
                        {isPaused ? (
                            <TouchableOpacity
                                onPress={handleResume}
                                className="flex-row items-center px-3 py-1.5 rounded-full bg-lime-400/15 border border-lime-400/40"
                            >
                                <Ionicons name="play-circle-outline" size={14} color="#a3e635" />
                                <AppText className="text-lime-400 text-xs font-bold ml-1">Resume</AppText>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={handleBreak}
                                className="flex-row items-center px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40"
                            >
                                <Ionicons name="pause-circle-outline" size={14} color="#fbbf24" />
                                <AppText className="text-amber-400 text-xs font-bold ml-1">Break</AppText>
                            </TouchableOpacity>
                        )}

                        {/* Stop */}
                        <TouchableOpacity
                            onPress={handleStop}
                            className="flex-row items-center px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/40"
                        >
                            <Ionicons name="stop-circle-outline" size={14} color="#ef4444" />
                            <AppText className="text-red-400 text-xs font-bold ml-1">Stop</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Task title */}
                <AppText className="text-white text-lg font-bold leading-snug mb-5" numberOfLines={2}>
                    {localTimer.taskTitle}
                </AppText>

                {/* Time stats row */}
                <View className="flex-row gap-3 mb-5">
                    {/* Elapsed */}
                    <View className="flex-1 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                        <AppText className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                            Elapsed
                        </AppText>
                        <AppText className="text-white text-xl font-bold font-mono">
                            {elapsedFormatted}
                        </AppText>
                    </View>

                    {/* Middle — break time while paused, remaining while running */}
                    <View className={`flex-1 bg-zinc-900 rounded-2xl p-4 border ${isPaused ? "border-amber-400/30" : "border-zinc-800"}`}>
                        <AppText className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                            {isPaused ? "Break" : isOvertime ? "Overtime" : "Remaining"}
                        </AppText>
                        <AppText
                            className={`text-xl font-bold font-mono ${isPaused ? "text-amber-400" : isOvertime ? "text-red-400" : "text-lime-400"
                                }`}
                        >
                            {isPaused ? breakFormatted : (isOvertime ? "+" : "") + remainingFormatted}
                        </AppText>
                    </View>
                </View>

                {/* Progress bar */}
                <View>
                    <View className="flex-row justify-between mb-1.5">
                        <AppText className="text-zinc-600 text-[10px]">Progress</AppText>
                        <AppText className="text-zinc-500 text-[10px]">
                            {localTimer.estimatedMinutes > 0
                                ? `${Math.min(Math.round((elapsed / (localTimer.estimatedMinutes * 60)) * 100), 100)}%`
                                : "—"}
                        </AppText>
                    </View>
                    <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <Animated.View
                            className={`h-full rounded-full ${isPaused ? "bg-amber-400" : isOvertime ? "bg-red-400" : "bg-lime-400"
                                }`}
                            style={progressBarStyle}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}
