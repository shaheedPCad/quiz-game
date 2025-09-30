import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { getMyPlayer, setMyNickname } from "@/features/lobby/api";
import { useLobbyMembers } from "@/features/lobby/hooks";
import { nicknameSchema } from "@/lib/validation";
import { supabase } from "@/services/supabase";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Share, Text, TextInput, View } from "react-native";

function lobbyChannel(lobbyId: string) {
  return supabase.channel(`lobby:${lobbyId}`, { config: { presence: { key: "user" } } });
}

export default function LobbyRoom() {
  const { id, code: codeParam } = useLocalSearchParams<{ id: string; code?: string }>();
  const [code, setCode] = useState(codeParam ?? "");
  const [isHost, setIsHost] = useState(false);

  // nickname modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: members = [] } = useLobbyMembers(id);
  const channel = useMemo(() => (id ? lobbyChannel(id) : null), [id]);

  // fetch lobby meta + decide host
  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: auth }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("lobbies").select("code, host_id").eq("id", id).single(),
      ]);
      if (!error && data) {
        if (!code) setCode(data.code);
        setIsHost(auth.user?.id === data.host_id);
      }
    })();
  }, [id]);

  // join presence
  useEffect(() => {
    if (!channel) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ id: user?.id || "anon" }); // nickname added after save
        }
      });
    })();
    return () => { channel.unsubscribe(); };
  }, [channel]);

  // prompt for nickname if missing/placeholder
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const me = await getMyPlayer(id);
        if (!me?.nickname || me.nickname === "Player") {
          setShowNameModal(true);
          setNickname("");
        }
      } catch { /* ignore */ }
    })();
  }, [id]);

  async function onSaveNickname() {
    try {
      const parsed = nicknameSchema.safeParse(nickname);
      if (!parsed.success) {
        setNameErr(parsed.error.issues[0]?.message ?? "Invalid");
        return;
      }
      setSaving(true);
      await setMyNickname(id!, parsed.data);
      setShowNameModal(false);
      setNameErr(null);

      // update presence meta with nickname
      const { data: { user } } = await supabase.auth.getUser();
      channel?.track({ id: user?.id || "anon", nickname: parsed.data });
    } catch (e: any) {
      setNameErr("Could not save name");
    } finally {
      setSaving(false);
    }
  }

  const canStart = isHost && members.length >= 2;

  return (
    <Screen className="px-6 py-10">
      <Text className="text-white text-3xl font-bold mb-2">Lobby</Text>
      <Text className="text-white/70 mb-6">Share this code with friends:</Text>

      <View className="items-center mb-6">
        <Text className="text-white text-4xl tracking-widest">{code || "———"}</Text>
      </View>

      <View className="flex-row gap-3 mb-10">
        <Button variant="ghost" onPress={async () => code && (await Clipboard.setStringAsync(code))}>Copy</Button>
        <Button onPress={async () => code && (await Share.share({ message: `Join my Quiz Rush lobby: ${code}` }))}>Share</Button>
      </View>

      <Text className="text-white text-2xl font-bold mb-2">Players</Text>
      <Text className="text-white/70 mb-4">People here ({members.length})</Text>

      <FlatList
        data={members}
        keyExtractor={(m) => m.user_id}
        renderItem={({ item }) => (
          <View className="mb-2 rounded-xl bg-white/5 px-4 py-3">
            <Text className="text-white">{item.nickname || item.user_id.slice(0, 6)}</Text>
            <Text className="text-white/50 text-xs">Score: {item.score}</Text>
          </View>
        )}
      />

      <View className="mt-8 flex-row gap-12">
        <Button variant="ghost" onPress={() => router.replace("/(root)")}>Leave</Button>
        <Button disabled={!canStart} onPress={() => {/* start game soon */}}>
          {isHost ? (canStart ? "Start" : "Waiting…") : "Waiting for host"}
        </Button>
      </View>

      {/* Nickname Modal */}
      <Modal transparent visible={showNameModal} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-[360px] rounded-2xl bg-neutral-900 p-5">
            <Text className="text-white text-xl font-semibold mb-3">Choose a nickname</Text>
            <TextInput
              autoFocus
              placeholder="e.g. SpeedyCoder"
              placeholderTextColor="#9aa0a6"
              className="mb-3 rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10"
              value={nickname}
              onChangeText={(t) => {
                setNickname(t);
                if (nameErr) setNameErr(null);
              }}
              maxLength={20}
            />
            {nameErr ? <Text className="text-red-400 mb-2">{nameErr}</Text> : null}
            <View className="flex-row gap-3 justify-end">
              <Button variant="ghost" onPress={() => setShowNameModal(false)}>Skip</Button>
              <Button onPress={onSaveNickname} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
