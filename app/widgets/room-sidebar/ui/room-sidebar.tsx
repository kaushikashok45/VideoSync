import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Member } from "contracts/member.ts";
import type { SocketClient } from "~/shared/api/socket-client.ts";
import type { ChatStore } from "~/entities/chat/chat-store.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import type { ReactionStore } from "~/entities/reaction/reaction-store.ts";
import ChatBox from "~/features/chat/ui/chat-box.tsx";
import MessageStream from "~/features/chat/ui/message-stream.tsx";
import HostTools from "~/features/room-controls/ui/host-tools.tsx";
import MemberList from "~/widgets/member-list/ui/member-list.tsx";
import ReactionRow from "./reaction-row.tsx";
import { LogOut, MessageSquareText, Settings, Users, X } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

export interface RoomSidebarProps {
  roomId: string;
  connectionLabel?: string;
  me: Member | null;
  membersStore: MembersStore;
  chatStore: ChatStore;
  reactionStore: ReactionStore;
  socket?: SocketClient | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openTab?: "chat" | "members";
  showToggle?: boolean;
  integrated?: boolean;
  onExit?: () => void;
}

type SidebarTab = "chat" | "members";

export default function RoomSidebar({
  roomId,
  connectionLabel = "In sync",
  me,
  membersStore,
  chatStore,
  reactionStore,
  socket = null,
  open: controlledOpen,
  onOpenChange,
  openTab,
  showToggle = true,
  integrated = false,
  onExit,
}: RoomSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const updateOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [tab, setTab] = useState<SidebarTab>("chat");
  useEffect(() => {
    if (openTab) setTab(openTab);
  }, [openTab]);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(() => updateOpen(false));
  useEffect(() => {
    closeRef.current = () => {
      if (integrated) return;
      updateOpen(false);
      toggleRef.current?.focus();
    };
  }, [integrated]);
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const members = useSyncExternalStore(
    membersStore.subscribe,
    () => membersStore.getState().members,
    () => membersStore.getState().members,
  );
  const messages = useSyncExternalStore(
    chatStore.subscribe,
    () => chatStore.getState().messages,
    () => chatStore.getState().messages,
  );
  const senderName = me?.name ?? "You";
  const close = () => closeRef.current();
  const participantSummary = members.length === 1
    ? "1 participant"
    : `${members.length} participants`;
  const chatLabel = messages.length === 0
    ? "Chat"
    : `Chat (${messages.length})`;

  return (
    <>
      {open && !integrated
        ? (
          <div
            data-testid="sidebar-scrim"
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-bg/80 backdrop-blur-sm"
            onClick={close}
          />
        )
        : null}
      {showToggle
        ? (
          <button
            ref={toggleRef}
            type="button"
            data-testid="sidebar-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open
              ? "Close chat and members"
              : "Open chat and members"}
            onClick={() => (open ? close() : updateOpen(true))}
            className="absolute bottom-[clamp(2rem,5vh,3rem)] right-md z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-raised/90 text-ink shadow-pop backdrop-blur transition-colors hover:text-brand-text focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <MessageSquareText className="size-5" />
          </button>
        )
        : null}
      <aside
        id={panelId}
        ref={panelRef}
        data-testid="room-sidebar"
        tabIndex={-1}
        inert={!open}
        aria-hidden={!open || undefined}
        role="dialog"
        aria-label="Room details"
        className={`fixed inset-x-0 bottom-0 z-40 flex max-h-[78vh] flex-col rounded-t-[28px] border-t border-line bg-surface-raised shadow-overlay transition-transform duration-300 motion-reduce:transition-none md:inset-x-auto md:bottom-md md:right-0 md:top-md md:max-h-[calc(100dvh-2rem)] md:w-[380px] md:rounded-[28px] md:border md:border-line ${
          integrated
            ? "md:bottom-0 md:top-0 md:w-[380px] md:rounded-r-[24px] md:rounded-l-none md:border-y-0 md:border-r md:border-l"
            : ""
        } ${
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-[calc(100%+1rem)]"
        }`}
      >
        <header className="border-b border-line px-md py-md">
          <div className="flex items-start justify-between gap-sm">
            <div className="flex flex-col gap-xxs">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-faint">
                Room {roomId}
              </p>
              <p
                role="status"
                aria-live="polite"
                className="font-mono text-sm text-ink-muted"
              >
                {connectionLabel}
              </p>
            </div>
            {integrated
              ? (
                <div className="flex items-center gap-xxs">
                  <IconButton
                    label="Open chat"
                    aria-pressed={tab === "chat"}
                    onClick={() => setTab("chat")}
                    className={tab === "chat" ? "bg-ink text-onbrand" : ""}
                  >
                    <MessageSquareText className="size-4.5" />
                  </IconButton>
                  <IconButton
                    label="Open room settings"
                    aria-pressed={tab === "members"}
                    onClick={() => setTab("members")}
                    className={tab === "members" ? "bg-ink text-onbrand" : ""}
                  >
                    <Settings className="size-4.5" />
                  </IconButton>
                  {onExit
                    ? (
                      <IconButton label="Leave watch party" onClick={onExit}>
                        <LogOut className="size-4.5" />
                      </IconButton>
                    )
                    : null}
                </div>
              )
              : (
                <IconButton label="Close room panel" onClick={close}>
                  <X className="size-4.5" />
                </IconButton>
              )}
          </div>
          <div className="mt-sm flex items-center gap-sm text-ink-muted">
            <span className="inline-flex items-center gap-xs font-mono text-xs">
              <Users aria-hidden="true" className="size-3.5" />
              {participantSummary}
            </span>
          </div>
        </header>
        {!integrated
          ? (
            <div className="flex items-center gap-xs border-b border-line px-md py-sm">
              <button
                type="button"
                data-testid="chat-tab"
                aria-label={chatLabel}
                aria-pressed={tab === "chat"}
                onClick={() => setTab("chat")}
                className={`rounded-md p-sm transition-colors ${
                  tab === "chat"
                    ? "bg-ink text-onbrand shadow-sm"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <MessageSquareText aria-hidden="true" className="size-5" />
              </button>
              <button
                type="button"
                data-testid="members-tab"
                aria-label="Members"
                aria-pressed={tab === "members"}
                onClick={() => setTab("members")}
                className={`rounded-md p-sm transition-colors ${
                  tab === "members"
                    ? "bg-ink text-onbrand shadow-sm"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <Users aria-hidden="true" className="size-5" />
              </button>
            </div>
          )
          : null}
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === "chat"
            ? (
              <>
                <MessageStream messages={messages} />
                <ReactionRow
                  onReact={(emoji) =>
                    socket === null
                      ? reactionStore.getState().send(emoji, senderName)
                      : socket.sendReaction(emoji, senderName)}
                />
                <ChatBox
                  store={chatStore}
                  senderName={senderName}
                  socket={socket}
                />
              </>
            )
            : (
              <div className="flex flex-1 flex-col gap-md overflow-y-auto p-md">
                <MemberList members={members} />
                {me?.role === "host"
                  ? <HostTools me={me} roomId={roomId} store={membersStore} />
                  : null}
              </div>
            )}
        </div>
      </aside>
    </>
  );
}
