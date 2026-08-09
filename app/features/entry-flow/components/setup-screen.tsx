import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { resolveRoomState } from "~/features/entry-flow/logic/resolve-room-state.ts";
import {
  resetRoomScopedStores,
  useOptionalAppStores,
  useOptionalSocketClient,
} from "~/shared/api/socket-bridge.tsx";
import { Badge, Button, TextField } from "~/shared/ui-kit/index.ts";
import {
  readHostSessionRoom,
  writeHostSessionRoom,
} from "../logic/host-session-room.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { MediaFrame } from "./media-frame.tsx";

export function SetupScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    role,
    roomId: sessionRoomId,
    updateRoomId,
    updateRole,
    updateUserName,
    userName,
  } = useContext(SessionContext);
  const socket = useOptionalSocketClient();
  const stores = useOptionalAppStores();
  const roomState = resolveRoomState(id, sessionRoomId);
  const [name, setName] = useState(userName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hostFlow = roomState.kind !== "invalid" &&
    readHostSessionRoom() === roomState.roomId;

  useEffect(() => {
    if (roomState.kind === "invalid" || sessionRoomId === roomState.roomId) {
      return;
    }
    updateRoomId(roomState.roomId);
  }, [roomState, sessionRoomId, updateRoomId]);

  useEffect(() => {
    if (!hostFlow || role === Role.HOST) return;
    updateRole(Role.HOST);
  }, [hostFlow, role, updateRole]);

  const continueToRoom = async () => {
    if (roomState.kind === "invalid") return;
    const resolvedName = hostFlow ? userName || "Host" : name.trim();
    if (!hostFlow && resolvedName === "") {
      setError("Enter your name to join the room.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      updateUserName(resolvedName);
      if (hostFlow) {
        const activeRoom = stores?.room.getState().room;
        if (activeRoom?.code === roomState.roomId) {
          navigate(`/${roomState.roomId}/file-upload`);
          return;
        }
        if (socket === null || stores === null) {
          throw new Error("Could not open this room.");
        }
        const room = await socket.createRoom(resolvedName);
        resetRoomScopedStores(stores);
        stores.room.getState().setRoom(room);
        writeHostSessionRoom(room.code);
        updateRoomId(room.code);
        navigate(
          `/${room.code}/file-upload`,
          room.code === roomState.roomId ? undefined : {
            replace: true,
            state: {
              notice:
                `The previous host room expired. Your new room code is ${room.code}.`,
            },
          },
        );
        return;
      }
      if (socket === null || stores === null) {
        throw new Error("Could not open this room.");
      }
      const payload = await socket.joinRoom(roomState.roomId, resolvedName);
      resetRoomScopedStores(stores);
      stores.room.getState().setRoom(payload.room);
      stores.members.getState().setMembers(
        payload.members,
        socket.getSocketId() ?? "",
      );
      const targetRoomId = payload.room.code;
      updateRoomId(targetRoomId);
      navigate(
        `/${targetRoomId}/RecieverVideoPlayerNew`,
        targetRoomId === roomState.roomId ? undefined : {
          state: {
            notice:
              `The active room is ${targetRoomId}. Share and use that code from here on.`,
          },
        },
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not open this room.",
      );
    } finally {
      setPending(false);
    }
  };

  if (roomState.kind === "invalid") {
    return (
      <EntryLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <section className="flex max-w-xl flex-col gap-lg border-t border-status-danger/40 bg-surface/60 p-xl text-center">
            <Badge variant="danger">Room not found</Badge>
            <h2 className="text-3xl font-semibold text-ink text-balance">
              That invite does not point to a valid room.
            </h2>
            <p className="font-mono text-sm text-ink-muted">
              Check the code and try again, or head back home to start fresh.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate("/")}>Return home</Button>
            </div>
          </section>
        </div>
      </EntryLayout>
    );
  }

  return (
    <EntryLayout>
      <div className="grid gap-xxl md:grid-cols-[minmax(0,1.1fr)_minmax(320px,400px)]">
        <section className="flex flex-col gap-lg">
          <div className="flex flex-wrap items-center gap-sm">
            <Badge variant="brand">
              {hostFlow ? "Host setup" : "Join setup"}
            </Badge>
            <span className="font-mono text-sm text-ink-faint">
              Room identity first
            </span>
          </div>
          <div className="flex flex-col gap-md">
            <h2 className="max-w-[14ch] text-4xl font-semibold text-ink text-balance md:text-5xl">
              {hostFlow
                ? "Set the room, then choose the video."
                : "Confirm the room before you join the screening."}
            </h2>
            <p className="max-w-[58ch] text-base leading-relaxed text-ink-muted text-pretty">
              {hostFlow
                ? "The shareable room code is confirmed before source selection so the code you copy is the code everyone uses."
                : "We keep the active room code stable all the way into playback, even if you open the invite in a fresh session."}
            </p>
          </div>
          <MediaFrame
            src={null}
            title={hostFlow ? "Host the room" : "Join the room"}
          >
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-sm p-lg md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xl font-semibold text-ink">
                  {hostFlow
                    ? "We will confirm the room code before it becomes shareable."
                    : "Add your name, then join the active room."}
                </p>
              </div>
              <Button
                size="lg"
                loading={pending}
                onClick={() => void continueToRoom()}
              >
                {hostFlow ? "Continue to source" : "Join and watch"}
              </Button>
            </div>
          </MediaFrame>
          {!hostFlow
            ? (
              <TextField
                label="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Ada"
              />
            )
            : null}
          {roomState.kind === "mismatch"
            ? (
              <p
                role="alert"
                className="border border-status-warning/30 bg-surface-raised px-md py-sm font-mono text-sm text-ink-muted"
              >
                Using active room{" "}
                <span className="text-ink">{roomState.roomId}</span> instead of
                {" "}
                {roomState.sessionRoomId}.
              </p>
            )
            : null}
          {error
            ? (
              <p role="alert" className="font-mono text-sm text-status-danger">
                {error}
              </p>
            )
            : null}
        </section>
        <div className="flex flex-col gap-lg">
          <section className="flex flex-col gap-md border-t border-line-strong pt-lg">
            <Badge>{hostFlow ? "Room identity" : "Join handoff"}</Badge>
            <p className="font-mono text-sm text-ink-muted text-pretty">
              {hostFlow
                ? "The canonical room code appears in live playback after the room opens."
                : "Your room context stays private here and appears in the live playback chrome once you join."}
            </p>
          </section>
          <section className="flex flex-col gap-md border-t border-line pt-lg">
            <Badge>{hostFlow ? "Host checklist" : "Join checklist"}</Badge>
            <ul className="grid gap-sm font-mono text-sm text-ink-muted">
              <li>• One active room ID carried through every next step.</li>
              <li>
                • Stable shell before metadata, sockets, or peer state arrive.
              </li>
              <li>• Quiet recovery if the active room ever changes.</li>
            </ul>
          </section>
        </div>
      </div>
    </EntryLayout>
  );
}
