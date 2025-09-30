import { useQuery } from "@tanstack/react-query";
import { fetchLobbyMembers } from "./api";

export function useLobbyMembers(lobbyId: string | undefined) {
  return useQuery({
    queryKey: ["lobby-members", lobbyId],
    queryFn: () => fetchLobbyMembers(lobbyId!),
    enabled: !!lobbyId,
    refetchInterval: 2000,  // simple live-ish updates (we can switch to realtime later)
  });
}
