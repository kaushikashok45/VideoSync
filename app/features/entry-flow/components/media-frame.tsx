import type { ReactNode, RefObject, SyntheticEvent } from "react";

export interface MediaFrameProps {
  src: string | null;
  title: string;
  posterUrl?: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
  onLoadedMetadata?: (event: SyntheticEvent<HTMLVideoElement>) => void;
  children?: ReactNode;
}

function FallbackArtwork() {
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-brand-soft p-lg md:p-xl">
      <span className="font-mono text-sm text-ink-muted">
        The screen is ready when you are.
      </span>
    </div>
  );
}

export function MediaFrame(
  { src, title, posterUrl, videoRef, onLoadedMetadata, children }:
    MediaFrameProps,
) {
  return (
    <section
      aria-label={title}
      className="relative aspect-video overflow-hidden rounded-lg border border-line-strong bg-surface-sunken shadow-overlay"
    >
      {posterUrl
        ? (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        )
        : <FallbackArtwork />}
      {src
        ? (
          <video
            ref={videoRef}
            src={src}
            preload="metadata"
            playsInline
            controls={false}
            onLoadedMetadata={onLoadedMetadata}
            className="absolute inset-0 h-full w-full bg-black object-contain"
          />
        )
        : null}
      <div className="scrim absolute inset-x-0 bottom-0 h-40" />
      {children}
    </section>
  );
}
