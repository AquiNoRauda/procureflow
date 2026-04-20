import React from 'react';
import { View, Text, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Tabs, Slot, usePathname, useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { ShoppingCart, Building2, BookOpen, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabConfig {
  name: string;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  path: string;
}

const TAB_CONFIGS: TabConfig[] = [
  { name: 'index', label: 'Orders', Icon: ShoppingCart, path: '/(app)/(tabs)/' },
  { name: 'two', label: 'By Supplier', Icon: Building2, path: '/(app)/(tabs)/two' },
  { name: 'catalog', label: 'Catalog', Icon: BookOpen, path: '/(app)/(tabs)/catalog' },
  { name: 'profile', label: 'Account', Icon: User, path: '/(app)/(tabs)/profile' },
];

function DesktopSidebar({ isDark }: { isDark: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = isDark ? '#0F172A' : '#FFFFFF';
  const border = isDark ? '#1E293B' : '#E2E8F0';
  const accent = '#2563EB';
  const accentBg = '#2563EB15';
  const inactiveColor = isDark ? '#64748B' : '#9CA3AF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';

  const isActive = (tab: TabConfig) => {
    if (tab.name === 'index') {
      return pathname === '/' || pathname === '/(app)/(tabs)' || pathname === '/(app)/(tabs)/';
    }
    return pathname.includes(`/(tabs)/${tab.name}`) || pathname.endsWith(`/${tab.name}`);
  };

  return (
    <View
      style={{
        width: 220,
        height: '100%',
        backgroundColor: bg,
        borderRightWidth: 1,
        borderRightColor: border,
        paddingBottom: insets.bottom + 16,
        flexShrink: 0,
      }}
      testID="desktop-sidebar">
      {/* App name / brand */}
      <View
        style={{
          paddingTop: 32 + insets.top,
          paddingHorizontal: 20,
          paddingBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ShoppingCart size={17} color={accent} />
        </View>
        <Text
          style={{
            color: textColor,
            fontSize: 16,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}>
          ProcureFlow
        </Text>
      </View>

      {/* Nav items */}
      <View style={{ flex: 1, paddingHorizontal: 12, gap: 4 }}>
        {TAB_CONFIGS.map((tab) => {
          const active = isActive(tab);
          return (
            <Pressable
              key={tab.name}
              onPress={() => router.navigate(tab.path as Parameters<typeof router.navigate>[0])}
              testID={`sidebar-tab-${tab.name}`}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: active ? accentBg : 'transparent',
                },
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined,
              ]}>
              <tab.Icon
                size={19}
                color={active ? accent : inactiveColor}
              />
              <Text
                style={{
                  color: active ? accent : inactiveColor,
                  fontSize: 14,
                  fontWeight: active ? '700' : '500',
                }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }} testID="desktop-layout">
        <DesktopSidebar isDark={isDark} />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#60A5FA' : '#2563EB',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderTopColor: isDark ? '#1F2937' : '#F3F4F6',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'By Supplier',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Building2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
