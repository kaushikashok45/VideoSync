import { validateUrl } from "~/features/media-source/model/source-resolver.ts";

export interface SourceActionStateInput {
  mode: "upload" | "url";
  fileName: string | null;
  url: string;
}

export interface SourceActionState {
  actionLabel: string;
  disabled: boolean;
  status: "idle" | "invalid" | "ready";
  detail: string;
}

export function resolveSourceActionState(
  input: SourceActionStateInput,
): SourceActionState {
  if (input.mode === "upload") {
    return input.fileName === null || input.fileName.trim() === ""
      ? {
        actionLabel: "Choose a video file",
        disabled: true,
        status: "idle",
        detail: "Pick a local video to unlock the room preview.",
      }
      : {
        actionLabel: "Continue to room",
        disabled: false,
        status: "ready",
        detail: "Your local video is ready for the room preview.",
      };
  }

  const error = validateUrl(input.url);
  return error === null
    ? {
      actionLabel: "Continue to room",
      disabled: false,
      status: "ready",
      detail: "We will verify the link and prepare the room preview next.",
    }
    : {
      actionLabel: "Paste a valid video URL",
      disabled: true,
      status: input.url.trim() === "" ? "idle" : "invalid",
      detail: input.url.trim() === ""
        ? "Paste a video URL to continue."
        : error,
    };
}
