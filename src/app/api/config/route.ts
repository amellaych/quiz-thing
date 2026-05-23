import { NextResponse } from "next/server";

// Returns runtime config to the client. The host page uses `publicUrl` (when set)
// to build a shareable join URL even when the host opens the app via localhost.
//
// Set PUBLIC_URL to your tunnel/public URL when running locally, e.g.:
//   PUBLIC_URL=https://your-tunnel.ngrok-free.app npm run dev
export async function GET() {
  const publicUrl = process.env.PUBLIC_URL || "";
  return NextResponse.json({ publicUrl });
}
