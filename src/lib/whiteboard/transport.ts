import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "./types";

export type Status = "connecting" | "live" | "offline";

export type Transport = {
  send(message: Message): void;
  close(): void;
};

/**
 * Live link between the people on a call: a Supabase Realtime broadcast channel named after the board's share token.
 * Nothing is stored by the channel itself; the owner's device saves the board. Without a connection the board still works
 * (drawing is local) and catches up through the saved copy.
 */
export function openTransport(token: string, onMessage: (message: Message) => void, onStatus: (status: Status) => void): Transport | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    onStatus("offline");
    return null;
  }
  const client: SupabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 40 } },
  });
  const channel: RealtimeChannel = client.channel(`wb:${token}`, { config: { broadcast: { self: false, ack: false } } });
  channel.on("broadcast", { event: "m" }, ({ payload }) => {
    if (payload && typeof payload === "object") onMessage(payload as Message);
  });
  onStatus("connecting");
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") onStatus("live");
    else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") onStatus("offline");
  });
  return {
    send(message) {
      void channel.send({ type: "broadcast", event: "m", payload: message });
    },
    close() {
      void client.removeChannel(channel);
      void client.realtime.disconnect();
    },
  };
}
