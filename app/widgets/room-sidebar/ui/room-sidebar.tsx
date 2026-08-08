import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import type { Member } from "contracts/member.ts";
import type { ChatStore } from "~/entities/chat/chat-store.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import type { ReactionStore } from "~/entities/reaction/reaction-store.ts";
import ChatBox from "~/features/chat/ui/chat-box.tsx";
import MessageStream from "~/features/chat/ui/message-stream.tsx";
import HostTools from "~/features/room-controls/ui/host-tools.tsx";
import MemberList from "~/widgets/member-list/ui/member-list.tsx";
import ReactionRow from "./reaction-row.tsx";
import SidebarTabButton from "./sidebar-tab-button.tsx";

export interface RoomSidebarProps {
  roomId: string;
  me: Member | null;
  membersStore: MembersStore;
  chatStore: ChatStore;
  reactionStore: ReactionStore;
}

type SidebarTab = "chat" | "members";

export default function RoomSidebar({
  roomId,
  me,
  membersStore,
  chatStore,
  reactionStore,
}: RoomSidebarProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SidebarTab>("chat");
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(() => setOpen(false));
  useEffect(() => {
    closeRef.current = () => {
      setOpen(false);
      toggleRef.current?.focus();
    };
  });
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
  );
  const messages = useSyncExternalStore(
    chatStore.subscribe,
    () => chatStore.getState().messages,
  );
  const senderName = me?.name ?? "You";
  const close = () => closeRef.current();

  return (
    <>
      {open
        ? (
          <div
            data-testid="sidebar-scrim"
            aria-hidden="true"
            className="absolute inset-0 z-20 bg-bg/72 animate-fade-in"
            onClick={close}
          />
        )
        : null}
      <button
        ref={toggleRef}
        type="button"
        data-testid="sidebar-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close chat and members" : "Open chat and members"}
        onClick={() => (open ? close() : setOpen(true))}
        className="absolute right-md top-md z-40 inline-flex h-10 w-10 items-center justify-center rounded-md bg-surface/80 text-ink-muted shadow-pop backdrop-blur transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <ChatBubbleLeftRightIcon className="size-5" />
      </button>
      <aside
        id={panelId}
        ref={panelRef}
        data-testid="room-sidebar"
        tabIndex={-1}
        inert={!open}
        aria-hidden={!open || undefined}
        className={`absolute z-30 flex flex-col bg-surface-raised shadow-overlay transition-transform duration-300 motion-reduce:transition-none inset-x-0 bottom-0 max-h-[75vh] rounded-t-lg border-t border-line md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-[340px] md:rounded-none md:rounded-l-lg md:border-l md:border-t-0 ${
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        <header className="flex items-center gap-xs border-b border-line px-md py-sm">
          <SidebarTabButton
            active={tab === "chat"}
            testId="chat-tab"
            label="Chat"
            onClick={() => setTab("chat")}
          />
          <SidebarTabButton
            active={tab === "members"}
            testId="members-tab"
            label="Members"
            onClick={() => setTab("members")}
          />
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === "chat"
            ? (
              <>
                <MessageStream messages={messages} />
                <ReactionRow
                  onReact={(emoji) =>
                    reactionStore.getState().send(emoji, senderName)}
                />
                <ChatBox store={chatStore} senderName={senderName} />
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
