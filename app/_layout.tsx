import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../utils/database';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
