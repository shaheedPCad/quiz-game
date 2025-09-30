import { ensureAnon, supabase } from "@/services/supabase";
import { useEffect, useState } from "react";

export function useAuthReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    }).data.subscription;

    (async () => {
      await ensureAnon();
      // if session already exists, mark ready
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    })();

    return () => { unsub?.unsubscribe(); };
  }, []);

  return ready;
}
