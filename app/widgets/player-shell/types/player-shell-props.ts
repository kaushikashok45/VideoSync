import type { MediaSource } from "contracts/media-source.ts";
import type { Member } from "contracts/member.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import type { ChatStore } from "~/entities/chat/chat-store.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import type { PlaybackStore } from "~/entities/playback/playback-store.ts";
import type { ReactionStore } from "~/entities/reaction/reaction-store.ts";

export interface PlayerShellProps {
  mode: "host" | "receiver";
  media: MediaSource | { url?: string };
  metadata?: MovieMetadata | null;
  me?: Member | null;
  roomId?: string;
  file?: File | null;
  idleMs?: number;
  playbackStore?: PlaybackStore;
  membersStore?: MembersStore;
  chatStore?: ChatStore;
  reactionStore?: ReactionStore;
  onExit?: () => void;
}
