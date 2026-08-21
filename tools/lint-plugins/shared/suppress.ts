import type { Baseline, Suppressor } from "../../contracts/suppress";
import { ignoreExpectedFailure } from "./ignore-expected-failure.ts";

/**
 * `typeof value === "object"` alone also passes for `null`, so a cast right
 * after that check would assert a shape `null` structurally satisfies too.
 * The guard below folds the `null` exclusion into the type predicate itself,
 * so every caller that narrows on it is safe, not merely cast-free.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasValidVersion(candidate: Record<string, unknown>): boolean {
  return candidate.version === 1 &&
    typeof candidate.generatedAt === "string";
}

function hasValidShape(candidate: Record<string, unknown>): boolean {
  return Array.isArray(candidate.paths) &&
    isRecord(candidate.violations) &&
    isRecord(candidate.perFile);
}

function isValidBaseline(value: unknown): value is Baseline {
  if (!isRecord(value)) return false;
  return hasValidVersion(value) && hasValidShape(value);
}

function readBaseline(baselinePath: string): Baseline | null {
  let text: string;
  try {
    text = Deno.readTextFileSync(baselinePath);
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
  try {
    const parsed = JSON.parse(text);
    return isValidBaseline(parsed) ? parsed : null;
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
}

/**
 * Loads a suppression gate from `baselinePath`, once. A missing, malformed,
 * or wrong-version baseline fails **closed**: `loaded` is `false` and every
 * `isKnown` call returns `false`, so the plugin reports everything rather
 * than silently treating a broken baseline as "all clear".
 */
export function loadSuppressor(baselinePath: string): Suppressor {
  const baseline = readBaseline(baselinePath);
  if (baseline === null) {
    return { loaded: false, isKnown: () => false };
  }
  const knownPaths = new Set(baseline.paths);
  return {
    loaded: true,
    isKnown: (path, identity) =>
      knownPaths.has(path) && (baseline.violations[identity] ?? 0) > 0,
  };
}
