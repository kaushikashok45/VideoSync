import { useContext, useEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { hostSourceStore } from "~/features/media-source/model/host-source-store.ts";
import { useOptionalAppStores } from "~/shared/api/socket-bridge.tsx";
import { Badge, Button } from "~/shared/ui-kit/index.ts";
import { readHostSessionRoom } from "../logic/host-session-room.ts";
import { resolveNowPlayingDetails } from "../logic/resolve-now-playing-details.ts";
import { resolveRoomState } from "../logic/resolve-room-state.ts";
import { useEnsureHostRoom } from "../logic/use-ensure-host-room.ts";
import { useHostPreview } from "../logic/use-host-preview.ts";
import { useMediaPreviewSource } from "../logic/use-media-preview-source.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { MediaFrame } from "./media-frame.tsx";
import { NowPlayingCard } from "./now-playing-card.tsx";

function idleSubscribe(_onStoreChange: () => void): () => void {
  return () => {};
}

export function HostPreplayScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { roomId: sessionRoomId, updateRoomId } = useContext(SessionContext);
  const roomState = resolveRoomState(id, sessionRoomId);
  const storedHostRoom = readHostSessionRoom();
  const isStoredHostRoom = roomState.kind !== "invalid" &&
    storedHostRoom === roomState.roomId;
  const recovering = useEnsureHostRoom({
    enabled: isStoredHostRoom,
    roomId: roomState.kind === "invalid" ? "" : roomState.roomId,
    sourceLabel: "the host preview",
  });
  const handoff = useSyncExternalStore(
    hostSourceStore.subscribe,
    () => hostSourceStore.getState(),
    () => hostSourceStore.getState(),
  );
  const stores = useOptionalAppStores();
  const memberCount = useSyncExternalStore(
    stores?.members.subscribe ?? idleSubscribe,
    () => (stores?.members.getState().members.length ?? 0) + 1,
    () => 1,
  );

  useEffect(() => {
    if (
      roomState.kind !== "invalid" &&
      storedHostRoom !== null &&
      storedHostRoom !== roomState.roomId
    ) {
      navigate(
        location.pathname.replace(/^\/[^/]+/, `/${storedHostRoom}`) +
          location.search,
        { replace: true },
      );
      return;
    }
    if (roomState.kind === "invalid") return;
    if (sessionRoomId === roomState.roomId) return;
    updateRoomId(roomState.roomId);
  }, [
    location.pathname,
    location.search,
    navigate,
    roomState,
    sessionRoomId,
    storedHostRoom,
    updateRoomId,
  ]);

  const effectiveSource = handoff.source;
  const effectivePreviewSrc = useMediaPreviewSource(
    effectiveSource,
    handoff.file,
  );
  const {
    videoRef,
    durationSeconds,
    autoplayBlocked,
    isPlaying,
    togglePlayback,
    syncDuration,
  } = useHostPreview(effectivePreviewSrc);

  if (roomState.kind === "invalid") {
    return (
      <EntryLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Button onClick={() => navigate("/")}>Return home</Button>
        </div>
      </EntryLayout>
    );
  }
  if (recovering) {
    return null;
  }
  const details = resolveNowPlayingDetails({
    source: effectiveSource,
    fileName: handoff.file?.name ?? null,
    metadata: handoff.metadata,
    durationSeconds,
  });
  const notice = (location.state as { notice?: string } | null)?.notice;
  const hasSource = effectiveSource !== null;
  const startWatching = () =>
    navigate(
      hasSource
        ? `/${roomState.roomId}/HostVideoPlayerNew`
        : `/${roomState.roomId}/file-upload`,
    );
  const previewLabel = autoplayBlocked
    ? "Preview with sound"
    : isPlaying
    ? "Pause preview"
    : "Play preview";

  return (
    <EntryLayout>
      <div className="grid items-start gap-xl lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-xxl">
        <section className="flex flex-col gap-lg">
          <div className="flex flex-wrap items-center gap-sm">
            <Badge variant="brand">Shared Room</Badge>
            <Badge>Host preview</Badge>
          </div>
          {notice
            ? (
              <p
                role="status"
                className="rounded-2xl border border-status-warning/30 bg-surface-raised px-md py-sm font-mono text-sm text-ink-muted"
              >
                {notice}
              </p>
            )
            : null}
          <MediaFrame
            src={effectivePreviewSrc}
            title={details.title}
            posterUrl={handoff.metadata?.posterUrl}
            videoRef={videoRef}
            onLoadedMetadata={syncDuration}
          >
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-sm p-lg">
              <Badge>
                {memberCount <= 1
                  ? "Just you for now"
                  : `${memberCount} people in the room`}
              </Badge>
              <Badge>
                {autoplayBlocked
                  ? "Sound blocked"
                  : isPlaying
                  ? "Preview live"
                  : "Ready to start"}
              </Badge>
            </div>
          </MediaFrame>
          <section className="flex min-h-24 items-center justify-between gap-md rounded-[20px] border border-line bg-surface p-lg">
            <div className="max-w-[42ch]">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-faint">
                Playback handoff
              </p>
              <p className="font-mono text-sm text-ink-muted text-pretty">
                {autoplayBlocked
                  ? "Your browser held back sound. Use the reserved action once and the layout stays put."
                  : "The stage is stable, the room code is live, and you can start the preview when you are ready."}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-sm">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => void togglePlayback()}
              >
                {previewLabel}
              </Button>
              <Button size="lg" onClick={startWatching}>
                {hasSource ? "Start watching" : "Choose a source"}
              </Button>
            </div>
          </section>
        </section>
        <div className="flex flex-col gap-lg">
          <NowPlayingCard
            details={details}
            metadata={handoff.metadata}
            onReplace={() => navigate(`/${roomState.roomId}/file-upload`)}
          />
          <section className="flex flex-col gap-md rounded-[20px] border border-line bg-surface p-lg">
            <Badge>Host checklist</Badge>
            <ul className="grid gap-sm font-mono text-sm text-ink-muted">
              <li>• The active room ID is the one you copy and share.</li>
              <li>
                • Local files keep their title and duration without movie
                metadata.
              </li>
              <li>
                • Playback starts from one fixed action without moving the
                stage.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </EntryLayout>
  );
}
