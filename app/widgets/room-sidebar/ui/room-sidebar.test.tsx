import { assertEquals } from "@std/assert";
import { act } from "react";
import type { Member } from "contracts/member.ts";
import { createChatStore } from "~/entities/chat/chat-store.ts";
import {
  createMembersStore,
  type MembersStore,
} from "~/entities/member/members-store.ts";
import { createReactionStore } from "~/entities/reaction/reaction-store.ts";
import { FakeSocketClient } from "~/shared/api/fake-socket-client.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import RoomSidebar from "./room-sidebar.tsx";

const ME: Member = {
  id: "host",
  name: "Host",
  role: "host",
  canControl: true,
  joinedAt: 100,
};

function stubMembers(): MembersStore {
  const store = createMembersStore();
  store.getState().setMembers(
    [
      { id: "host", name: "Host", role: "host", canControl: true, joinedAt: 0 },
      {
        id: "v1",
        name: "Viewer",
        role: "viewer",
        canControl: false,
        joinedAt: 1,
      },
    ],
    "host",
  );
  return store;
}
function sidebar(
  me: Member | null = ME,
  socket: FakeSocketClient | null = null,
) {
  const { container } = render(
    <RoomSidebar
      roomId="abc23"
      connectionLabel="Waiting for host"
      me={me}
      membersStore={stubMembers()}
      chatStore={createChatStore()}
      reactionStore={createReactionStore()}
      socket={socket}
    />,
  );
  return container;
}
function toggle(container: HTMLElement): Element {
  return container.querySelector('[data-testid="sidebar-toggle"]') as Element;
}
function aside(container: HTMLElement): Element | null {
  return container.querySelector('[data-testid="room-sidebar"]');
}
function openSidebar(container: HTMLElement): void {
  click(toggle(container));
  assertEquals(
    toggle(container).getAttribute("aria-expanded"),
    "true",
    "toggle should expand after click",
  );
}
// 1. Happy path: opens and shows the Chat tab by default.
Deno.test("opens on toggle click and shows the Chat tab", () => {
  setupDom();
  const container = sidebar();
  openSidebar(container);
  assertEquals(
    container.querySelector('[data-testid="chat-tab"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="chat-stream"]') !== null,
    true,
  );
  const panel = document.querySelector('[data-testid="room-sidebar"]');
  assertEquals(panel?.textContent?.includes("abc23"), true);
  assertEquals(panel?.textContent?.includes("Waiting for host"), true);
});
// 2. Sad/Edge: closed means aria-expanded=false and the panel is hidden.
Deno.test("closed: aria-expanded is false and the panel is hidden", () => {
  setupDom();
  const container = sidebar();
  assertEquals(toggle(container).getAttribute("aria-expanded"), "false");
  assertEquals(
    aside(document.body as unknown as HTMLElement)?.getAttribute("aria-hidden"),
    "true",
  );
});
// 3. Mutation: switching tabs swaps the visible panel content.
Deno.test("switching tabs swaps the visible panel content", () => {
  setupDom();
  const container = sidebar();
  openSidebar(container);
  assertEquals(
    container.querySelector('[data-testid="member-list"]') === null,
    true,
    "chat tab is active first, member list hidden",
  );
  click(container.querySelector('[data-testid="members-tab"]') as Element);
  assertEquals(
    container.querySelector('[data-testid="member-list"]') !== null,
    true,
  );
  click(container.querySelector('[data-testid="chat-tab"]') as Element);
  assertEquals(
    container.querySelector('[data-testid="chat-stream"]') !== null,
    true,
  );
});
// 4. Limits: closing returns focus to the toggle button and hides the panel.
Deno.test("closing via the backdrop returns focus to the toggle", () => {
  setupDom();
  const container = sidebar();
  openSidebar(container);
  click(document.querySelector('[data-testid="sidebar-scrim"]') as Element);
  assertEquals(toggle(container).getAttribute("aria-expanded"), "false");
  assertEquals(
    document.querySelector('[data-testid="room-sidebar"]')?.getAttribute(
      "aria-hidden",
    ),
    "true",
  );
  assertEquals(document.activeElement, toggle(container));
});
// 4b. Limits: Escape also closes the sidebar.
Deno.test("Escape closes the open sidebar", () => {
  setupDom();
  const container = sidebar();
  openSidebar(container);
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  assertEquals(toggle(container).getAttribute("aria-expanded"), "false");
});

// 4c. Edge: a non-host still gets a chat/member sidebar (host tools are hidden).
Deno.test("viewer sees the sidebar without host tools", () => {
  setupDom();
  const container = sidebar({
    id: "v1",
    name: "Viewer",
    role: "viewer",
    canControl: false,
    joinedAt: 1,
  });
  openSidebar(container);
  click(container.querySelector('[data-testid="members-tab"]') as Element);
  assertEquals(
    container.querySelector('[data-testid="member-list"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="host-tools"]') === null,
    true,
  );
});

Deno.test("panel uses a fixed overlay so opening it does not resize the player stage", () => {
  setupDom();
  const container = sidebar();
  openSidebar(container);
  const panel = document.querySelector('[data-testid="room-sidebar"]');
  assertEquals(panel?.className.includes("fixed"), true);
  assertEquals(panel?.className.includes("md:right-0"), true);
});

function integratedSidebar(): HTMLElement {
  const { container } = render(
    <RoomSidebar
      roomId="abc23"
      connectionLabel="In sync"
      me={ME}
      membersStore={stubMembers()}
      chatStore={createChatStore()}
      reactionStore={createReactionStore()}
      open
      integrated
      showToggle={false}
    />,
  );
  return container;
}

Deno.test("integrated mode always shows chat and has no tab switcher", () => {
  setupDom();
  const container = integratedSidebar();
  assertEquals(container.querySelector('[data-testid="chat-tab"]'), null);
  assertEquals(container.querySelector('[data-testid="members-tab"]'), null);
  assertEquals(
    container.querySelector('[data-testid="chat-stream"]') !== null,
    true,
  );
  assertEquals(
    container.querySelector('[data-testid="room-sidebar"]')
      ?.className.includes("fixed"),
    false,
  );
});

Deno.test("integrated mode's header is a plain Chat label with no room/status chrome or member toggle", () => {
  setupDom();
  const container = integratedSidebar();
  const panel = container.querySelector('[data-testid="room-sidebar"]');
  assertEquals(panel?.querySelector("header")?.textContent, "Chat");
  assertEquals(panel?.textContent?.includes("abc23"), false);
  assertEquals(panel?.textContent?.includes("In sync"), false);
  assertEquals(
    container.querySelector('[aria-label="Show member list"]'),
    null,
  );
});

Deno.test("chat and reaction actions use the active socket when one is provided", () => {
  setupDom();
  const socket = new FakeSocketClient();
  let sentChat = "";
  let sentReaction = "";
  socket.sendChat = (text: string) => {
    sentChat = text;
  };
  socket.sendReaction = (emoji: string) => {
    sentReaction = emoji;
  };
  const container = sidebar(ME, socket);
  openSidebar(container);
  const field = container.querySelector(
    "input[aria-label='Chat message']",
  ) as HTMLInputElement;
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setValue?.call(field, "hello room");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  click(container.querySelector("button[type='submit']") as Element);
  click(container.querySelector('[aria-label^="React "]') as Element);
  assertEquals(sentChat, "hello room");
  assertEquals(sentReaction, "👍");
});
