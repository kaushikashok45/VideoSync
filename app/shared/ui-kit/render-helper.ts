import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { ReactElement } from "react";

export interface RenderResult {
  container: HTMLDivElement;
}

/** jsdom has no viewport concept; a no-op observer is enough for `whileInView` to mount. */
class StubIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function stubAnimationFrame(target: Record<string, unknown>): void {
  target.requestAnimationFrame = (callback: FrameRequestCallback) =>
    setTimeout(() => callback(Date.now()), 0);
  target.cancelAnimationFrame = clearTimeout;
}

function assignDomGlobals(
  target: Record<string, unknown>,
  dom: JSDOM,
): void {
  target.window = dom.window;
  target.document = dom.window.document;
  target.navigator = dom.window.navigator;
  target.HTMLElement = dom.window.HTMLElement;
  target.HTMLMediaElement = dom.window.HTMLMediaElement;
  target.HTMLVideoElement = dom.window.HTMLVideoElement;
  target.HTMLButtonElement = dom.window.HTMLButtonElement;
  target.HTMLInputElement = dom.window.HTMLInputElement;
  target.Node = dom.window.Node;
  target.Element = dom.window.Element;
  target.Event = dom.window.Event;
  target.KeyboardEvent = dom.window.KeyboardEvent;
  target.MouseEvent = dom.window.MouseEvent;
  target.CustomEvent = dom.window.CustomEvent;
  target.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
}

export function setupDom(): void {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const target = globalThis as unknown as Record<string, unknown>;
  assignDomGlobals(target, dom);
  target.IS_REACT_ACT_ENVIRONMENT = true;
  target.IntersectionObserver = StubIntersectionObserver;
  stubAnimationFrame(target);
}

export function render(element: ReactElement): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return { container };
}

export type EventTargetish = Element | Document;

export function click(element: EventTargetish): void {
  act(() => {
    element.dispatchEvent(
      new globalThis.MouseEvent("click", { bubbles: true }),
    );
  });
}

export function pressKey(element: EventTargetish, key: string): void {
  act(() => {
    element.dispatchEvent(
      new globalThis.KeyboardEvent("keydown", { key, bubbles: true }),
    );
  });
}

export function mouseDown(element: EventTargetish): void {
  act(() => {
    element.dispatchEvent(
      new globalThis.MouseEvent("mousedown", { bubbles: true }),
    );
  });
}
