// Source - https://stackoverflow.com/a/77917503
// Posted by Chamsedin azouz, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-07, License - CC BY-SA 4.0

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function DropDown() {
  const [show, setShow] = useState(false);
  const progressHeight = useSharedValue(0);
  const arrowHeight = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: progressHeight.value,
    };
  });

  const animatedArrow = useAnimatedStyle(() => {
    return {
      borderTopWidth: arrowHeight.value,
      borderBottomWidth: arrowHeight.value,
    };
  });

  const startAnimation = () => {
    progressHeight.value === 0 &&
      ((arrowHeight.value = withTiming(10, { duration: 1 })),
      (progressHeight.value = withTiming(100, { duration: 300 })), // Adjust your height as needed here (100)
      setShow(true));
    progressHeight.value > 0 &&
      ((progressHeight.value = withTiming(0, { duration: 300 })),
      setTimeout(() => {
        arrowHeight.value = withTiming(0, { duration: 1 });
        setShow(false);
      }, 200));
  };

  return (
    <View>
      <TouchableOpacity onPress={startAnimation}>
        <Ionicons name="ellipsis-vertical" color="white" size={25} />
      </TouchableOpacity>
      <Animated.View style={[styles.container, animatedStyle]}>
        {show && (
          <View className="p-4 justify-center">
            <Text className="text-lg">Option 1</Text>
            <Text className="text-lg">Option 2</Text>
            <Text className="text-lg">Option 3</Text>
          </View>
        )}
      </Animated.View>
      <Animated.View style={[styles.arrow, animatedArrow]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 0,
    backgroundColor: "white",
    position: "absolute",
    right: -12,
    marginTop: 30,
    borderRadius: 10,
    elevation: 15,
    top: 10,
    overflow: "hidden",
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
    borderRightColor: "white",
    transform: [{ rotate: "90deg" }],
  },
});
