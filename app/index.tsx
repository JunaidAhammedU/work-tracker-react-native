import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, View } from "react-native";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      // Add any initialization logic here (e.g., check auth, load data)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

      // Hide the splash screen
      await SplashScreen.hideAsync();

      // Navigate to the main tabs
      router.replace("/(tabs)/home");
    };

    prepare();
  }, []);

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <Text>IndexScreen</Text>
    </View>
  );
}
