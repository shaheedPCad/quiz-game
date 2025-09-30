// app/(lobby)/host.tsx
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { createLobby } from "@/features/lobby/api";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function HostLobby() {
  const [loading, setLoading] = useState(false);

  async function onCreate() {
    try {
      setLoading(true);
      const lobby = await createLobby();         // { id, code }
      router.replace(`/(lobby)/room/${lobby.id}?code=${lobby.code}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="items-center justify-center">
      <View className="w-full max-w-[360px] gap-4">
        <Text className="text-white text-2xl font-semibold">Host Lobby</Text>
        <Button size="lg" onPress={onCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Lobby"}
        </Button>
      </View>
    </Screen>
  );
}
