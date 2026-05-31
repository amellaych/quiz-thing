"use client";
import { getTheme } from "@/lib/themes";

/**
 * Full-screen animated themed background. Renders behind all content.
 * Pass a theme id (and optional custom image URL) to control the look.
 */
export function Background({
  themeId,
  imageUrl,
}: {
  themeId?: string;
  imageUrl?: string;
}) {
  const theme = getTheme(themeId);
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: theme.background }}
    >
      {/* Custom image layer (optional) */}
      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-slate-950/55" />
        </>
      )}

      {/* Floating soft blobs for motion */}
      <div
        className="blob animate-float-a"
        style={{ background: theme.blobs[0], top: "-8%", left: "-6%" }}
      />
      <div
        className="blob animate-float-b"
        style={{ background: theme.blobs[1], top: "30%", right: "-10%" }}
      />
      <div
        className="blob animate-float-c"
        style={{ background: theme.blobs[2] ?? theme.blobs[0], bottom: "-12%", left: "25%" }}
      />

      {/* Subtle grain/vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45))]" />
    </div>
  );
}
