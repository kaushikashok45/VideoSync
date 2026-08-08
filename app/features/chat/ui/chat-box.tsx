import { useState } from "react";
import type { ChatStore } from "~/entities/chat/chat-store.ts";
import { Button, TextField } from "~/shared/ui-kit/index.ts";
import { sendChatMessage } from "../model/chat-behaviour.ts";

export interface ChatBoxProps {
  store: ChatStore;
  senderName: string;
}

export default function ChatBox({ store, senderName }: ChatBoxProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
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
