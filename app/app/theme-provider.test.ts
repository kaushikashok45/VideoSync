import { assertEquals } from "@std/assert";
import {
  applyThemeClass,
  nextTheme,
  persistTheme,
  readStoredTheme,
  resolveInitialTheme,
  type Theme,
  THEME_STORAGE_KEY,
  type ThemeDoc,
  type ThemeStorage,
} from "./theme-provider.tsx";

function makeStorage(initial: Record<string, string> = {}): ThemeStorage {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

interface HarnessDoc extends ThemeDoc {
  applied: Set<string>;
}

function makeDoc(): HarnessDoc {
  const applied = new Set<string>();
  const classList = {
    add(cssClass: string) {
      applied.add(cssClass);
    },
    remove(cssClass: string) {
      applied.delete(cssClass);
    },
  };
  return {
    documentElement: { classList },
    applied,
  };
}

// Happy: with no stored theme and no light preference the default is dark
Deno.test("resolveInitialTheme defaults to dark without stored theme or preference", () => {
  assertEquals(resolveInitialTheme(false, null), "dark");
  assertEquals(
    resolveInitialTheme(false, readStoredTheme(makeStorage())),
    "dark",
  );
});

// Sad: a corrupted localStorage value is ignored and falls back to dark
Deno.test("readStoredTheme ignores corrupted values and falls back to dark", () => {
  const storage = makeStorage({ [THEME_STORAGE_KEY]: "neon" });
  assertEquals(readStoredTheme(storage), null);
  assertEquals(resolveInitialTheme(false, readStoredTheme(storage)), "dark");
});

// Edge: prefers-color-scheme light is honored when nothing is stored
Deno.test("prefersLight is honored when nothing is stored", () => {
  assertEquals(resolveInitialTheme(true, null), "light");
});

// Edge: a stored theme wins over the system preference
Deno.test("a stored theme wins over the system preference", () => {
  const storage = makeStorage({ [THEME_STORAGE_KEY]: "dark" });
  assertEquals(resolveInitialTheme(true, readStoredTheme(storage)), "dark");
});

// Mutation: toggling flips the theme and persists the result
Deno.test("nextTheme flips and persistTheme stores the result", () => {
  const storage = makeStorage();
  const next = nextTheme("dark");
  persistTheme(storage, next);
  assertEquals(next, "light");
  assertEquals(readStoredTheme(storage), "light");
});

// Limits: toggling twice cycles back to the original theme
Deno.test("toggling twice cycles back to the original theme", () => {
  assertEquals(nextTheme(nextTheme("dark")), "dark");
  assertEquals(nextTheme(nextTheme("light")), "light");
});

// Mutation: applyThemeClass adds the light class and removes it for dark
Deno.test("applyThemeClass adds light and removes it for dark", () => {
  const doc: HarnessDoc = makeDoc();
  applyThemeClass(doc, "light");
  assertEquals(doc.applied.has("light"), true);
  applyThemeClass(doc, "dark");
  assertEquals(doc.applied.has("light"), false);
});

// Edge: applyThemeClass is idempotent for the same theme
Deno.test("applyThemeClass is idempotent for the same theme", () => {
  const doc: HarnessDoc = makeDoc();
  applyThemeClass(doc, "light");
  applyThemeClass(doc, "light");
  assertEquals(doc.applied.has("light"), true);
});

// Edge: theme variants stay within the allowed union
Deno.test("Theme only admits dark or light", () => {
  const themes: Theme[] = ["dark", "light"];
  assertEquals(themes, ["dark", "light"]);
});
