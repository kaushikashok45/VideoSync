import { useContext, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { useSourceBehaviour } from "~/features/media-source/model/source-behaviour.ts";
import SourcePicker from "~/features/media-source/ui/source-picker.tsx";
import UploadDropzone from "~/features/media-source/ui/upload-dropzone.tsx";
import UrlField from "~/features/media-source/ui/url-field.tsx";
import { Badge, Button } from "~/shared/ui-kit/index.ts";
import { readHostSessionRoom } from "../logic/host-session-room.ts";
import { resolveRoomState } from "../logic/resolve-room-state.ts";
import { resolveSourceActionState } from "../logic/resolve-source-action-state.ts";
import { useEnsureHostRoom } from "../logic/use-ensure-host-room.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { LandingNavigation } from "./landing-navigation.tsx";

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

  if (roomState.kind === "invalid") {
    return (
      <EntryLayout headerActions={<LandingNavigation />}>
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
  const notice = (location.state as { notice?: string } | null)?.notice;

  return (
    <EntryLayout headerActions={<LandingNavigation />}>
      <div className="grid items-start gap-xl lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-xxl">
        <section className="flex min-w-0 flex-col gap-lg">
          <div className="flex flex-wrap items-center gap-sm">
            <Badge variant="brand">Source selection</Badge>
            <span className="font-mono text-sm text-ink-faint">Host only</span>
          </div>
          <div className="flex flex-col gap-md">
            <h2 className="max-w-[18ch] text-4xl font-semibold leading-[1.04] text-ink text-balance md:text-5xl">
              Set the picture in motion.
            </h2>
            <p className="max-w-[58ch] text-base leading-relaxed text-ink-muted text-pretty">
              Choose a local file or paste a public video URL. Once it loads,
              you will move straight into the shared watch.
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
          <section className="flex min-h-[22rem] flex-col justify-end gap-sm border-y border-line-strong py-xl">
            <p className="font-mono text-sm font-semibold text-brand-text">
              Source selection
            </p>
            <p className="max-w-[28ch] text-2xl font-semibold leading-tight text-ink text-balance">
              Bring the film. We&apos;ll bring the room.
            </p>
            <p className="font-mono text-sm text-ink-muted">
              {error ?? sourceState.detail}
            </p>
          </section>
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
        </div>
      </div>
    </EntryLayout>
  );
}
