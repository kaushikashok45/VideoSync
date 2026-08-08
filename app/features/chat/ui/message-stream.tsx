import type { ChatMessage } from "contracts/chat-message.ts";

export interface MessageStreamProps {
  messages: ChatMessage[];
}

function isSystemMessage(message: ChatMessage): boolean {
  return message.senderId === "system";
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function MessageStream({ messages }: MessageStreamProps) {
  return (
    <ul
      data-testid="chat-stream"
      className="flex flex-1 flex-col gap-sm overflow-y-auto p-md"
    >
      {messages.map((message) => (
        <li key={message.id} data-testid="chat-message">
          {isSystemMessage(message)
            ? (
              <p className="mx-auto w-fit rounded-full bg-surface px-sm py-xxs font-mono text-xs text-ink-faint">
                {message.text}
              </p>
            )
            : (
              <div className="rounded-md bg-surface px-sm py-xs">
                <p className="font-mono text-xs font-semibold text-ink-muted">
                  {message.senderName}
                  <span className="ml-xs font-normal text-ink-faint">
                    {formatTime(message.ts)}
                  </span>
                </p>
                <p className="mt-xxs font-mono text-sm text-ink">
                  {message.text}
                </p>
              </div>
            )}
        </li>
      ))}
    </ul>
  );
}
