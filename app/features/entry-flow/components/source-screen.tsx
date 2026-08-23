import { useContext, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { useSourceBehaviour } from "~/features/media-source/model/source-behaviour.ts";
import { SourcePicker } from "~/features/media-source/ui/source-picker.tsx";
import UploadDropzone from "~/features/media-source/ui/upload-dropzone.tsx";
import UrlField from "~/features/media-source/ui/url-field.tsx";
import { Button, useReveal } from "~/shared/ui-kit/index.ts";
import { readHostSessionRoom } from "../logic/host-session-room.ts";
import { resolveRoomState } from "../logic/resolve-room-state.ts";
import { resolveSourceActionState } from "../logic/resolve-source-action-state.ts";
import { useEnsureHostRoom } from "../logic/use-ensure-host-room.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { LandingNavigation } from "./landing-navigation.tsx";
import { SourceScreenLayout } from "./source-screen-layout.tsx";

const STAGGER_STEP_MS = 60;

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
      navigate(route);
    },
  });
  const revealEyebrow = useReveal({ delayMs: 0 });
  const revealHeadline = useReveal({ delayMs: STAGGER_STEP_MS });
  const revealPicker = useReveal({ delayMs: STAGGER_STEP_MS * 2 });
  const revealInput = useReveal({ delayMs: STAGGER_STEP_MS * 3 });
  const revealAction = useReveal({ delayMs: STAGGER_STEP_MS * 4 });

  if (roomState.kind === "invalid") {
    return (
      <EntryLayout headerActions={<LandingNavigation />}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Button onClick={() => navigate("/")}>Return home</Button>
        </div>
      </EntryLayout>
    );
  }
  if (recovering) return null;
  const sourceState = resolveSourceActionState({
    mode: source,
    fileName: file?.name ?? null,
    url,
  });
  const notice = (location.state as { notice?: string } | null)?.notice;
  const pickerElement = (
    <div
      className="w-full animate-fade-up motion-reduce:animate-none"
      style={revealPicker.style}
    >
      <SourcePicker source={source} onChange={pending ? () => {} : setSource} />
    </div>
  );
  const inputElement = (
    <div
      className="w-full animate-fade-up motion-reduce:animate-none"
      style={revealInput.style}
    >
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
    </div>
  );
  return (
    <EntryLayout headerActions={<LandingNavigation />}>
      <SourceScreenLayout
        eyebrowStyle={revealEyebrow.style}
        headlineStyle={revealHeadline.style}
        notice={notice}
        picker={pickerElement}
        input={inputElement}
        actionStyle={revealAction.style}
        pending={pending}
        disabled={sourceState.disabled}
        actionLabel={sourceState.actionLabel}
        helperText={error ?? sourceState.detail}
        error={error}
        onSubmit={() => void submit()}
      />
    </EntryLayout>
  );
}
