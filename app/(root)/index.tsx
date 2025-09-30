import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <Screen className="items-center justify-center">
      <Text className="text-white text-4xl font-bold mb-8">Quiz Rush</Text>

      <View className="w-full gap-3 max-w-[320px]">
        <Link href="/(lobby)/host" asChild>
          <Button size="lg">Host Lobby</Button>
        </Link>

        <Link href="/(lobby)/join" asChild>
          <Button size="lg" variant="ghost">Join Lobby</Button>
        </Link>
      </View>
    </Screen>
  );
}
