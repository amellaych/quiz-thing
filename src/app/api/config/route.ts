import { NextResponse } from "next/server";
import os from "os";

// Returns runtime config to the client.
// - `publicUrl`: an internet-reachable URL (set PUBLIC_URL when using a tunnel
//   or a deployed site). Used to build the shareable join link/QR.
// - `lanUrl`: this machine's local-network URL (e.g. http://192.168.1.42:3000).
//   Lets phones/PCs on the SAME Wi-Fi join even when the host opened the app
//   via localhost.
export async function GET() {
  const publicUrl = process.env.PUBLIC_URL || "";
  const port = process.env.PORT || "3000";

  let lanUrl = "";
  try {
    const nets = os.networkInterfaces();
    const candidates: string[] = [];
    for (const name of Object.keys(nets)) {
      for (const net of (nets[name] || []) as Array<{ family: string | number; internal: boolean; address: string }>) {
        // IPv4, not internal (skip 127.0.0.1)
        const family = typeof net.family === "string" ? net.family : `IPv${net.family}`;
        if (family === "IPv4" && !net.internal) candidates.push(net.address);
      }
    }
    // Prefer common private LAN ranges (192.168.x, 10.x, 172.16-31.x).
    const preferred =
      candidates.find((ip) => ip.startsWith("192.168.")) ||
      candidates.find((ip) => ip.startsWith("10.")) ||
      candidates.find((ip) => /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) ||
      candidates[0];
    if (preferred) lanUrl = `http://${preferred}:${port}`;
  } catch {
    // ignore
  }

  return NextResponse.json({ publicUrl, lanUrl });
}
