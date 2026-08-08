import { assertEquals } from "@std/assert";
import { createMembersStore } from "~/entities/member/members-store.ts";
import type { Member } from "contracts/member.ts";
import { click, render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import MemberControlList from "./member-control-list.tsx";

function host(): Member {
  return { id: "host", name: "H", role: "host", canControl: true, joinedAt: 0 };
}

function viewer(id: string, canControl: boolean): Member {
  return {
    id,
    name: `V${id}`,
    role: "viewer",
    canControl,
    joinedAt: 0,
  };
}

// Mutation pin: the Switch onChange delivers the DESIRED next state. Turning a
// viewer's control ON must grant (never revoke), and OFF must revoke. An
// inverted branch makes the toggle permanently stuck — this pins it.
Deno.test("toggling a viewer ON grants control, OFF revokes", () => {
  setupDom();
  const store = createMembersStore();
  store.getState().setMembers([host(), viewer("v1", false)], "host");
  const { container } = render(
    <MemberControlList me={host()} store={store} />,
  );
  const switchEl = container.querySelector('button[role="switch"]');
  if (!switchEl) throw new Error("no switch");
  click(switchEl);
  assertEquals(
    store.getState().members.find((m) => m.id === "v1")?.canControl,
    true,
  );
  click(switchEl);
  assertEquals(
    store.getState().members.find((m) => m.id === "v1")?.canControl,
    false,
  );
});

// Edge: only non-host members appear in the list
Deno.test("the host is excluded from the control list", () => {
  setupDom();
  const store = createMembersStore();
  store.getState().setMembers([host(), viewer("v1", false)], "host");
  const { container } = render(
    <MemberControlList me={host()} store={store} />,
  );
  const switches = container.querySelectorAll('button[role="switch"]');
  assertEquals(switches.length, 1);
  assertEquals(container.textContent?.includes("H"), false);
});
