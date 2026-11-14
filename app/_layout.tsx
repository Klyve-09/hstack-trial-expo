import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: '#285d4a', headerStyle: { backgroundColor: '#faf8f4' } }}>
        <Stack.Screen name="index" options={{ title: 'Pocket Notes' }} />
        <Stack.Screen name="compose" options={{ title: 'New note' }} />
        <Stack.Screen name="item/[id]" options={{ title: 'Note' }} />
      </Stack>
    </>
  );
}
