import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

// Status options should mirror the strings used throughout the app so
// that editing a task in the home screen uses the same values as the
// create/edit screens. Previously the keys were "todo", "inprogress",
// "done" which caused a mismatch and resulted in the dropdown showing
// incorrectly (sometimes blank) and updates not reflecting saved data.
//
// The app elsewhere stores status values like "Pending", "In Progress",
// and "Completed".  We'll use those exact strings for both key and label.
export const TASK_STATUS_OPTIONS = [
    { key: "Pending", label: "Pending" },
    { key: "In Progress", label: "In Progress" },
    { key: "Completed", label: "Completed" },
];

// Sentinel key — not a real status, triggers the timer
export const START_WORK_KEY = "__start_work__";

export default function TaskStatusDropdown({
    value,
    onChange,
    onStartWork,
    onBreak,
}: {
    value: string;
    onChange: (status: string) => void;
    onStartWork?: () => void;
    onBreak?: () => void;
}) {
    const [show, setShow] = useState(false);
    const progressHeight = useSharedValue(0);
    const arrowHeight = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({ height: progressHeight.value }));
    const animatedArrow = useAnimatedStyle(() => ({ borderTopWidth: arrowHeight.value, borderBottomWidth: arrowHeight.value }));

    const startAnimation = () => {
        if (progressHeight.value === 0) {
            arrowHeight.value = withTiming(10, { duration: 1 });
            progressHeight.value = withTiming(220, { duration: 300 });
            setShow(true);
        } else {
            progressHeight.value = withTiming(0, { duration: 300 });
            setTimeout(() => {
                arrowHeight.value = withTiming(0, { duration: 1 });
                setShow(false);
            }, 200);
        }
    };

    return (
        <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={startAnimation} style={styles.trigger} activeOpacity={0.7}>
                <Ionicons name="ellipsis-vertical" color="#fff" size={22} />
            </TouchableOpacity>
            <Animated.View style={[styles.container, animatedStyle]}>
                {show && (
                    <View style={styles.optionsWrap}>
                        {/* Start Work — triggers the timer */}
                        <TouchableOpacity
                            style={styles.startWorkOption}
                            onPress={() => {
                                startAnimation();
                                onStartWork?.();
                            }}
                        >
                            <Ionicons name="play-circle-outline" size={15} color="#a3e635" style={{ marginRight: 6 }} />
                            <Text style={styles.startWorkText}>Start Work</Text>
                        </TouchableOpacity>

                        {/* Take a Break — triggers pause on active timer */}
                        <TouchableOpacity
                            style={styles.breakOption}
                            onPress={() => {
                                startAnimation();
                                onBreak?.();
                            }}
                        >
                            <Ionicons name="pause-circle-outline" size={15} color="#fbbf24" style={{ marginRight: 6 }} />
                            <Text style={styles.breakText}>Take a Break</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={{ height: 1, backgroundColor: "#27272a", marginVertical: 4 }} />

                        {TASK_STATUS_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[styles.option, value === option.key && styles.selectedOption]}
                                onPress={() => {
                                    onChange(option.key);
                                    startAnimation();
                                }}
                            >
                                <Text style={[styles.optionText, value === option.key && styles.selectedText]}>{option.label}</Text>
                                {value === option.key && <Ionicons name="checkmark" size={16} color="#22c55e" style={{ marginLeft: 8 }} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Animated.View>
            <Animated.View style={[styles.arrow, animatedArrow]} />
        </View>
    );
}

const styles = StyleSheet.create({
    trigger: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: "#18181b",
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        width: 160,
        height: 0,
        backgroundColor: "#18181b",
        position: "absolute",
        right: -12,
        marginTop: 30,
        borderRadius: 12,
        elevation: 15,
        top: 10,
        overflow: "hidden",
        zIndex: 10,
        borderWidth: 1,
        borderColor: "#27272a",
    },
    optionsWrap: {
        padding: 8,
        justifyContent: "center",
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 2,
        backgroundColor: "#18181b",
    },
    selectedOption: {
        backgroundColor: "#22c55e22",
    },
    optionText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "500",
    },
    selectedText: {
        color: "#22c55e",
    },
    startWorkOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 2,
        backgroundColor: "#a3e63515",
        borderWidth: 1,
        borderColor: "#a3e63530",
    },
    startWorkText: {
        color: "#a3e635",
        fontSize: 14,
        fontWeight: "600",
    },
    breakOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 2,
        backgroundColor: "#fbbf2415",
        borderWidth: 1,
        borderColor: "#fbbf2430",
    },
    breakText: {
        color: "#fbbf24",
        fontSize: 14,
        fontWeight: "600",
    },
    arrow: {
        position: "absolute",
        top: 25,
        right: 7,
        borderTopWidth: 0,
        borderTopColor: "transparent",
        borderBottomWidth: 0,
        borderBottomColor: "transparent",
        borderRightWidth: 10,
        borderRightColor: "#18181b",
        transform: [{ rotate: "90deg" }],
    },
});
