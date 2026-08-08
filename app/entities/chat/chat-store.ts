import { createStore, type StoreApi } from "zustand/vanilla";
import type { ChatMessage } from "contracts/chat-message.ts";

export const LOCAL_SENDER_ID = "local";

export interface ChatStoreDeps {
  maxMessages?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  send(text: string, senderName: string): ChatMessage | undefined;
  append(m: ChatMessage): void;
}

export type ChatStore = StoreApi<ChatState>;

function capped(list: ChatMessage[], max: number): ChatMessage[] {
  if (list.length <= max) return list;
  return list.slice(list.length - max);
}

export function createChatStore(deps: ChatStoreDeps = {}): ChatStore {
  const maxMessages = deps.maxMessages ?? 200;
  return createStore<ChatState>()((set, get) => ({
    messages: [],
    send(text, senderName) {
      if (text.trim() === "") return undefined;
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: LOCAL_SENDER_ID,
        senderName,
        text,
        ts: Date.now(),
      };
      const { messages } = get();
      set({ messages: capped([...messages, message], maxMessages) });
      return message;
    },
    append(m) {
      const { messages } = get();
      set({ messages: capped([...messages, m], maxMessages) });
    },
  }));
}
