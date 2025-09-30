import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Share, Text, TextInput, View } from "react-native";

import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { getMyPlayer, setMyNickname } from "@/features/lobby/api";
import { useLobbyMembers } from "@/features/lobby/hooks";
import { nicknameSchema } from "@/lib/validation";
import { supabase } from "@/services/supabase";

/** Realtime presence channel for this lobby */
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
        if (status === "SUBSCRIBED") channel.track({ id: user?.id || "anon" });
      });
    })();
    return () => { channel.unsubscribe(); };
  }, [channel]);

  // prompt for nickname if missing
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const me = await getMyPlayer(id);
        if (!me?.nickname || me.nickname === "Player") {
          setShowNameModal(true);
          setNickname("");
        }
      } catch {}
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

      const { data: { user } } = await supabase.auth.getUser();
      channel?.track({ id: user?.id || "anon", nickname: parsed.data });
    } catch {
      setNameErr("Could not save name");
    } finally {
      setSaving(false);
    }
  }

  const canStart = isHost && members.length >= 2;

  return (
    <Screen className="flex-1 bg-black">
      {/* content */}
      <View className="flex-1 px-6 pt-8 pb-24">
        {/* Title */}
        <View className="mb-6">
          <Text className="text-white text-4xl font-extrabold tracking-tight">Lobby</Text>
          <Text className="text-white/60 mt-1">Invite friends with this code</Text>
        </View>

        {/* Code Card */}
        <View className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <Text className="text-white text-5xl font-bold tracking-[0.35em] text-center">
            {code || "———"}
          </Text>

          <View className="mt-4 flex-row gap-3 justify-center">
            <Button
              variant="ghost"
              className="rounded-xl bg-white/10 px-4 py-3"
              onPress={async () => code && (await Clipboard.setStringAsync(code))}
            >
              Copy
            </Button>
            <Button
              className="rounded-xl px-5 py-3"
              onPress={async () => code && (await Share.share({ message: `Join my Quiz Rush lobby: ${code}` }))}
            >
              Share
            </Button>
          </View>
        </View>

        {/* Players */}
        <View className="mb-3 flex-row items-end justify-between">
          <Text className="text-white text-2xl font-bold">Players</Text>
          <Text className="text-white/60">Online: {members.length}</Text>
        </View>

        {/* List */}
        <FlatList
          data={members}
          keyExtractor={(m) => m.user_id}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => (
            <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              {/* Placeholder avatar circle */}
              <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
                <Text className="text-white font-bold">
                  {(item.nickname || item.user_id).slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-white text-base font-semibold">
                  {item.nickname || item.user_id.slice(0, 6)}
                </Text>
                <Text className="text-white/50 text-xs">Score: {item.score}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-white/50">Waiting for players…</Text>
          }
        />
      </View>

      {/* Sticky bottom bar */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 px-6 pb-6 pt-3">
        <View className="flex-row items-center justify-between">
          <Button
            variant="ghost"
            className="bg-white/10 px-5 py-3 rounded-xl"
            onPress={() => router.replace("/(root)")}
          >
            Leave
          </Button>

          <Button
            disabled={!canStart}
            className={`px-6 py-3 rounded-xl ${canStart ? "" : "opacity-50"}`}
            onPress={() => {/* next: start game */}}
          >
            {isHost ? (canStart ? "Start" : "Waiting…") : "Waiting for host"}
          </Button>
        </View>
      </View>

      {/* Nickname Modal */}
      <Modal transparent visible={showNameModal} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#121216] p-5">
            <Text className="text-white text-xl font-semibold mb-3">Choose a nickname</Text>
            <TextInput
              autoFocus
              placeholder="e.g. SpeedyCoder"
              placeholderTextColor="#9aa0a6"
              className="mb-3 rounded-xl bg-white/10 px-4 py-3 text-white border border-white/10"
              value={nickname}
              onChangeText={(t) => { setNickname(t); if (nameErr) setNameErr(null); }}
              maxLength={20}
            />
            {nameErr ? <Text className="text-red-400 mb-2">{nameErr}</Text> : null}
            <View className="flex-row gap-3 justify-end">
              <Button variant="ghost" className="bg-white/10 px-4 py-3 rounded-xl" onPress={() => setShowNameModal(false)}>Skip</Button>
              <Button className="px-5 py-3 rounded-xl" onPress={onSaveNickname} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
