import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function LobbyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#000" },
        headerLeft: () => (
          <Pressable onPress={() => router.push("/(root)")} className="px-3 py-2">
            <Text className="text-white">Home</Text>
          </Pressable>
        )
      }}
    >
    <Stack.Screen name="room/[id]" options={{ title: "Lobby" }} />

    </Stack>
  );
}
