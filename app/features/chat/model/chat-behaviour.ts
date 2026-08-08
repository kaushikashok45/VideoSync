import { AppError } from "contracts/app-error.ts";
import type { ChatMessage } from "contracts/chat-message.ts";
import type { ChatStore } from "~/entities/chat/chat-store.ts";

export const CHAT_MAX_LENGTH = 500;

export type ChatSendResult =
  | { status: "sent"; message: ChatMessage }
  | { status: "rejected"; error?: AppError };

export function sendChatMessage(
  store: ChatStore,
  text: string,
  senderName: string,
): ChatSendResult {
  const trimmed = text.trim();
  if (trimmed === "") return { status: "rejected" };
  if (trimmed.length > CHAT_MAX_LENGTH) {
    return {
      status: "rejected",
      error: new AppError("VALIDATION_CHAT_TOO_LONG"),
    };
  }
  const message = store.getState().send(trimmed, senderName);
  if (!message) return { status: "rejected" };
  return { status: "sent", message };
}
