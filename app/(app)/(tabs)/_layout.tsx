import { Tabs } from 'expo-router';

import { useI18n } from '@/src/providers/LocaleProvider';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t('dashboardTab') }} />
      <Tabs.Screen name="inventory" options={{ title: t('inventoryTab') }} />
      <Tabs.Screen name="add-product" options={{ title: t('addProductTab') }} />
      <Tabs.Screen name="history" options={{ title: t('historyTab') }} />
      <Tabs.Screen name="nfc" options={{ title: t('nfcTab') }} />
      <Tabs.Screen name="settings" options={{ title: t('settingsTab') }} />
    </Tabs>
  );
}
