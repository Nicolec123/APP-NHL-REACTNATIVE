import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, colorsOlympics, type ThemeColors } from './src/theme';
import { useAppStore } from './src/store/useAppStore';
import type { RootTabParamList } from './src/types/navigation';
import { HomeScreen } from './src/screens/HomeScreen';
import { TeamsScreen } from './src/screens/TeamsScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { WallpapersScreen } from './src/screens/WallpapersScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GameDayScreen } from './src/screens/GameDayScreen';
import { useHydrateApp } from './src/hooks/useHydrateApp';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Teams: 'trophy',
  Favorites: 'star',
  News: 'newspaper',
  Wallpapers: 'image',
  Profile: 'person',
  GameDay: 'calendar',
};

function getNavTheme(themeColors: ThemeColors) {
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: themeColors.background,
      card: themeColors.surface,
      border: themeColors.border,
      text: themeColors.text,
      primary: themeColors.primary,
    },
  };
}

export default function App() {
  const { isHydrated } = useHydrateApp();
  const mode = useAppStore(state => state.mode);
  const themeColors: ThemeColors = mode === 'olympics' ? colorsOlympics : colors;

  if (!isHydrated) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: themeColors.background,
          }}
        >
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />
      <NavigationContainer theme={getNavTheme(themeColors)}>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: themeColors.surface,
              borderTopColor: themeColors.border,
              borderTopWidth: 1,
              paddingTop: 6,
              minHeight: 56,
            },
            tabBarActiveTintColor: themeColors.primary,
            tabBarInactiveTintColor: themeColors.textSecondary,
            tabBarShowLabel: true,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[route.name]} size={size ?? 22} color={color} />
            ),
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
          <Tab.Screen name="Teams" component={TeamsScreen} options={{ title: 'Times' }} />
          <Tab.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{
              title: 'Favoritos',
              tabBarButton: () => null,
            }}
          />
          <Tab.Screen name="News" component={NewsScreen} options={{ title: 'Notícias' }} />
          <Tab.Screen
            name="Wallpapers"
            component={WallpapersScreen}
            options={{
              title: 'Wallpapers',
              tabBarButton: () => null,
            }}
          />
          <Tab.Screen name="GameDay" component={GameDayScreen} options={{ title: 'Game Day' }} />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Perfil',
              tabBarButton: () => null,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
