"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/** Get (or lazily create) the singleton client socket. */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() must be called in the browser");
  }
  if (!socket) {
    socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

/** Promise-style helper for socket emits with ack callbacks. */
export function emitWithAck<T = any>(event: string, payload?: any): Promise<T> {
  const s = getSocket();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Timeout")), 8000);
    s.emit(event, payload, (resp: T) => {
      clearTimeout(t);
      resolve(resp);
    });
  });
}
