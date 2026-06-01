import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const { initialize } = useAuthStore();
  const { fetchFavorites, clear } = useFavoritesStore();

  useEffect(() => {
    // Initialize auth and subscribe to changes
    const unsubscribe = initialize((session) => {
      if (session?.user) {
        fetchFavorites(session.user.id);
      } else {
        clear();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="auth"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen name="recipe/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="cook/[id]"
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
      </Stack>
    </>
  );
}
