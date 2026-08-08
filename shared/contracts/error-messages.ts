import type { ErrorCode } from "./error-code.ts";
import type { Recovery } from "./recovery.ts";

export const ERROR_DEFS: Record<
  ErrorCode,
  { message: string; recovery?: Recovery }
> = {
  VALIDATION_NAME_EMPTY: { message: "Please enter a name before continuing." },
  VALIDATION_CODE_MALFORMED: {
    message: "That room code isn't valid. Check it and try again.",
  },
  VALIDATION_URL_UNSUPPORTED: {
    message: "That link can't be played here. Try a different video URL.",
  },
  ROOM_NOT_FOUND: {
    message:
      "We couldn't find that room. The code may be wrong or the party may have ended.",
    recovery: { label: "Back to home", action: { kind: "home" } },
  },
  ROOM_FULL: { message: "That room is full. Try again later." },
  ROOM_LOCKED: { message: "That room is locked. Ask the host to unlock it." },
  ROOM_ENDED: {
    message: "The host ended the party.",
    recovery: { label: "Back to home", action: { kind: "home" } },
  },
  ROOM_PERMISSION_DENIED: { message: "You don't have permission to do that." },
  MEDIA_UPLOAD_FAILED: {
    message: "The file couldn't be uploaded.",
    recovery: {
      label: "Choose another file",
      action: { kind: "choose-source" },
    },
  },
  MEDIA_CAPTURE_FAILED: {
    message: "We couldn't capture the video from your file.",
  },
  MEDIA_UNSUPPORTED_CODEC: {
    message: "That file's format isn't supported by your browser.",
  },
  MEDIA_URL_UNPLAYABLE: {
    message: "That video couldn't start playing.",
    recovery: {
      label: "Try a different link",
      action: { kind: "choose-source" },
    },
  },
  SYNC_DRIFT_OUT_OF_BOUNDS: {
    message: "Your video got out of sync.",
    recovery: { label: "Resync", action: { kind: "resync" } },
  },
  SYNC_MEDIA_NOT_READY: { message: "Waiting for the video to be ready." },
  TRANSPORT_DISCONNECTED: {
    message: "You were disconnected.",
    recovery: { label: "Reconnect", action: { kind: "reconnect" } },
  },
  TRANSPORT_RECONNECT_FAILED: {
    message: "We couldn't reconnect. Check your connection.",
    recovery: { label: "Reconnect", action: { kind: "reconnect" } },
  },
  TRANSPORT_PEER_FAILED: {
    message: "The stream to one viewer was lost.",
    recovery: { label: "Retry", action: { kind: "retry" } },
  },
  SERVER_INTERNAL: {
    message: "Something went wrong on our end. Please try again.",
  },
  SERVER_RATE_LIMITED: {
    message: "That was sent too quickly. Please slow down.",
  },
  SERVER_ROOM_CAPACITY: { message: "This room is at capacity." },
};

export function errorMessageFor(code: ErrorCode): string {
  return ERROR_DEFS[code].message;
}
