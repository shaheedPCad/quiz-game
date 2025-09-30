import { supabase } from "@/services/supabase";

function randCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random()*alphabet.length)]).join("");
}

export async function createLobby() {
  const code = randCode();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");
  const { data, error } = await supabase
    .from("lobbies")
    .insert({ code, host_id: user.id })
    .select()
    .single();
  if (error) throw error;
  // host joins as a player, too
  await supabase.from("players").insert({ lobby_id: data.id, user_id: user.id }).single();
  return data; // { id, code, ... }
}

export async function joinLobbyByCode(code: string) {
  // call the RPC (works even if user isn't a member yet)
  const { data: rows, error: e1 } = await supabase
    .rpc('find_lobby_by_code', { p_code: code.toUpperCase() });

  if (e1 || !rows || rows.length === 0) {
    throw new Error("Invalid or closed code");
  }
  const lobby = rows[0]; // { id, code }

  // now add this user as a player (RLS allows inserting self)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");
  const { error: e2 } = await supabase
    .from('players')
    .insert({ lobby_id: lobby.id, user_id: user.id })
    .select()
    .maybeSingle();

  if (e2 && !String(e2.code).includes('duplicate')) throw e2;
  return lobby;
}

export async function fetchLobbyMembers(lobbyId: string) {
  const { data, error } = await supabase.rpc("get_lobby_members", { p_lobby: lobbyId });
  if (error) throw error;
  return (data ?? []) as { user_id: string; nickname: string; score: number; joined_at: string }[];
}

export async function getMyPlayer(lobbyId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");
  const { data, error } = await supabase
    .from("players")
    .select("id, user_id, nickname, score, joined_at")
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function setMyNickname(lobbyId: string, nickname: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user");
  const { error } = await supabase
    .from("players")
    .update({ nickname })
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id);
  if (error) throw error;
  return true;
}