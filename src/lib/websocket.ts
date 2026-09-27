import { generateJWT } from "./jwt";

export async function resetWebSocketRooms(rooms: string[]): Promise<void> {
  if (!rooms || rooms.length === 0) return;

  const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:1234";
  const httpUrl =
    process.env.WEBSOCKET_INTERNAL_HTTP_URL ||
    wsUrl
      .replace(/^ws:\/\//, "http://")
      .replace(/^wss:\/\//, "https://")
      .replace("0.0.0.0", "127.0.0.1");

  try {
    const token = await generateJWT("system", "admin", rooms);
    const res = await fetch(`${httpUrl}/reset-rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rooms }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.warn(`[resetWebSocketRooms] Failed with status ${res.status}`);
    }
  } catch (err) {
    console.error("[resetWebSocketRooms] Error resetting rooms:", err);
  }
}
