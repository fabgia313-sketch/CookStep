import { Tabs } from 'expo-router';
import { Home, Heart, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.semiBold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explorer', tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoris', tabBarIcon: ({ color, size }) => <Heart size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}
