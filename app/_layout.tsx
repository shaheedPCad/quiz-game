import { useAuthReady } from "@/hooks/useAuthReady";
import { queryClient } from '@/services/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../app/globals.css";

export default function RootLayout() {
  const ready = useAuthReady();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
        <QueryClientProvider client={queryClient}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top','left','right']}>
            {ready ? <Slot /> : (
              <Text style={{ color: "white", textAlign: "center", marginTop: 40 }}>
                Connecting…
              </Text>
            )}
          </SafeAreaView>
        </QueryClientProvider>

    </SafeAreaProvider>
  );
}
