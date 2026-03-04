import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const TASK_STATUS_OPTIONS = [
    { key: "todo", label: "To Do" },
    { key: "inprogress", label: "In Progress" },
    { key: "done", label: "Done" },
];

export default function TaskStatusDropdown({ value, onChange }: { value: string; onChange: (status: string) => void }) {
    const [show, setShow] = useState(false);
    const progressHeight = useSharedValue(0);
    const arrowHeight = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({ height: progressHeight.value }));
    const animatedArrow = useAnimatedStyle(() => ({ borderTopWidth: arrowHeight.value, borderBottomWidth: arrowHeight.value }));

    const startAnimation = () => {
        if (progressHeight.value === 0) {
            arrowHeight.value = withTiming(10, { duration: 1 });
            progressHeight.value = withTiming(120, { duration: 300 });
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
