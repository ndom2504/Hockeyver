import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/navigation/app-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="nhl" options={{ title: 'NHL' }} />
      <Tabs.Screen name="community" options={{ title: 'Communauté' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
