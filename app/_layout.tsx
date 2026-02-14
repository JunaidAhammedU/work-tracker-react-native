import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })

  const colorScheme = useColorScheme();

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ headerShown: false, presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="tasks/create" options={{ headerShown: false }} />
        <Stack.Screen name="tasks/edit" options={{ headerShown: false }} />
        <Stack.Screen name="tasks/[taskId]" options={{ headerShown: false, title: 'Task Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
