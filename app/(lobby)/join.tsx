import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Screen from "@/components/ui/Screen";
import { joinLobbyByCode } from "@/features/lobby/api";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function JoinLobby() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (code.trim().length !== 6) return setError("Code must be 6 chars");
    setError(null);
    setLoading(true);
    try {
      const lobby = await joinLobbyByCode(code.toUpperCase());
      router.replace(`/(lobby)/room/${lobby.id}?code=${lobby.code}`);


    } catch (e: any) {
      console.log(e);
      setError("Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="items-center justify-center">
      <View className="w-full max-w-[360px] gap-3">
        <Text className="text-white text-2xl font-semibold mb-2">Join a Lobby</Text>
        <Input
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          maxLength={6}
          placeholder="Enter 6-char code"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {error ? <Text className="text-red-400">{error}</Text> : null}
        <Button size="lg" onPress={submit} disabled={loading}>
          {loading ? "Joining..." : "Join"}
        </Button>
        <Button variant="ghost" onPress={() => router.push("/(root)")}>Back to Home</Button>
      </View>
    </Screen>
  );
}
