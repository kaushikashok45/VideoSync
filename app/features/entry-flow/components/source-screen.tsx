import { useContext, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import type { MediaSource } from "contracts/media-source.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { useSourceBehaviour } from "~/features/media-source/model/source-behaviour.ts";
import SourcePicker from "~/features/media-source/ui/source-picker.tsx";
import UploadDropzone from "~/features/media-source/ui/upload-dropzone.tsx";
import UrlField from "~/features/media-source/ui/url-field.tsx";
import { Badge, Button } from "~/shared/ui-kit/index.ts";
import { resolveNowPlayingDetails } from "../logic/resolve-now-playing-details.ts";
import { readHostSessionRoom } from "../logic/host-session-room.ts";
import { resolveRoomState } from "../logic/resolve-room-state.ts";
import { resolveSourceActionState } from "../logic/resolve-source-action-state.ts";
import { useEnsureHostRoom } from "../logic/use-ensure-host-room.ts";
import { useMediaPreviewSource } from "../logic/use-media-preview-source.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { MediaFrame } from "./media-frame.tsx";
import { NowPlayingCard } from "./now-playing-card.tsx";

function previewSource(
  mode: "upload" | "url",
  file: File | null,
): MediaSource | null {
  if (mode === "upload") return file ? { mode: "upload" } : null;
  return null;
}

export function SourceScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { roomId: sessionRoomId, updateRoomId } = useContext(SessionContext);
  const roomState = resolveRoomState(id, sessionRoomId);
  const storedHostRoom = readHostSessionRoom();
  const recovering = useEnsureHostRoom({
    enabled: roomState.kind !== "invalid" &&
      storedHostRoom === roomState.roomId,
    roomId: roomState.kind === "invalid" ? "" : roomState.roomId,
    sourceLabel: "source selection",
  });

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

  const {
    source,
    setSource,
    url,
    setUrl,
    file,
    setFile,
    pending,
    error,
    submit,
  } = useSourceBehaviour({
    roomId: roomState.kind === "invalid" ? "" : roomState.roomId,
    onDone: (route) => {
      if (roomState.kind === "invalid") return;
      updateRoomId(roomState.roomId);
      if (!route.endsWith("/HostVideoPlayerNew")) {
        navigate(route);
        return;
      }
      navigate(`${route}?preview=1`);
    },
  });
  const currentSource = previewSource(source, file);
  const previewSrc = useMediaPreviewSource(currentSource, file);

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

  const sourceState = resolveSourceActionState({
    mode: source,
    fileName: file?.name ?? null,
    url,
  });
  const details = resolveNowPlayingDetails({
    source: currentSource,
    fileName: file?.name ?? null,
    metadata: null,
    durationSeconds: null,
  });
  const notice = (location.state as { notice?: string } | null)?.notice;

  return (
    <EntryLayout>
      <div className="grid items-start gap-xl lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-xxl">
        <section className="flex min-w-0 flex-col gap-lg">
          <div className="flex flex-wrap items-center gap-sm">
            <Badge variant="brand">Source selection</Badge>
            <span className="font-mono text-sm text-ink-faint">Host only</span>
          </div>
          <div className="flex flex-col gap-md">
            <h2 className="max-w-[18ch] text-4xl font-semibold leading-[1.04] text-ink text-balance md:text-5xl">
              Choose the source, then move straight into the host room preview.
            </h2>
            <p className="max-w-[58ch] text-base leading-relaxed text-ink-muted text-pretty">
              Local files get a real now-playing state right away. URL sources
              keep the stage stable while the metadata lookup happens next.
            </p>
          </div>
          {notice
            ? (
              <p
                role="status"
                className="border border-status-warning/30 bg-surface-raised px-md py-sm font-mono text-sm text-ink-muted"
              >
                {notice}
              </p>
            )
            : null}
          <MediaFrame src={previewSrc} title={details.title}>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-md p-lg">
              <div>
                <p className="text-lg font-semibold text-ink md:text-xl">
                  {error ?? sourceState.detail}
                </p>
              </div>
            </div>
          </MediaFrame>
        </section>
        <div className="flex min-w-0 flex-col gap-lg lg:pt-[3.75rem]">
          <section className="flex flex-col gap-md border-t border-line-strong pt-lg">
            <SourcePicker
              source={source}
              onChange={pending ? () => {} : setSource}
            />
            {source === "url"
              ? (
                <UrlField
                  value={url}
                  onChange={pending ? () => {} : setUrl}
                  error={error}
                />
              )
              : (
                <UploadDropzone
                  onFile={pending ? () => {} : (next) => setFile(next)}
                />
              )}
            <Button
              size="lg"
              loading={pending}
              disabled={sourceState.disabled}
              onClick={() => void submit()}
            >
              {pending ? "Preparing room preview" : sourceState.actionLabel}
            </Button>
          </section>
          <NowPlayingCard details={details} metadata={null} />
        </div>
      </div>
    </EntryLayout>
  );
}
