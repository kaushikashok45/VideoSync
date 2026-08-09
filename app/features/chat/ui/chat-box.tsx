import { useState } from "react";
import { AppError } from "contracts/app-error.ts";
import type { ChatStore } from "~/entities/chat/chat-store.ts";
import type { SocketClient } from "~/shared/api/socket-client.ts";
import { Button, TextField } from "~/shared/ui-kit/index.ts";
import { CHAT_MAX_LENGTH, sendChatMessage } from "../model/chat-behaviour.ts";

export interface ChatBoxProps {
  store: ChatStore;
  senderName: string;
  socket?: SocketClient | null;
}

export default function ChatBox(
  { store, senderName, socket = null }: ChatBoxProps,
) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (socket !== null) {
      if (trimmed === "") {
        setError("That message can't be sent.");
        return;
      }
      if (trimmed.length > CHAT_MAX_LENGTH) {
        setError(new AppError("VALIDATION_CHAT_TOO_LONG").message);
        return;
      }
      socket.sendChat(trimmed, senderName);
      setText("");
      setError(null);
      return;
    }
    const result = sendChatMessage(store, text, senderName);
    if (result.status === "sent") {
      setText("");
      setError(null);
      return;
    }
    setError(result.error?.message ?? "That message can't be sent.");
  };

  return (
    <form
      data-testid="chat-composer"
      className="flex items-start gap-sm border-t border-line bg-surface p-md"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextField
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onInput={(event) => {
          setText((event.target as HTMLInputElement).value);
        }}
        placeholder="Say something…"
        aria-label="Chat message"
        error={error ?? undefined}
        className="flex-1"
      />
      <Button type="submit" disabled={text.trim() === ""}>
        Send
      </Button>
    </form>
  );
}
