import { createDumbUiRuleKit } from "./dumb-ui-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createDumbUiRuleKit>;

const RULE_ID = "dumb-ui/no-local-state";
const BANNED_HOOKS = new Set([
  "useState",
  "useEffect",
  "useReducer",
  "useContext",
]);
const MESSAGE =
  "Presentation may not hold local state or lifecycle: no useState/useEffect/" +
  "useReducer/useContext. Own this data one layer up, in model/.";

/**
 * Detects a banned hook by callee name only, covering both `useState(...)`
 * and the member-call form `React.useState(...)`.
 *
 * `useRef` is deliberately absent from `BANNED_HOOKS`: `useRef(null)` for a
 * DOM node is normal in dumb UI, and useRef-as-state is only heuristically
 * detectable from the AST alone. That residue belongs to
 * `reviewer-architecture` (Tier 3) per docs/GOVERNANCE.md, not to this rule.
 */
function bannedName(name: string): string | null {
  return BANNED_HOOKS.has(name) ? name : null;
}

function isReactObject(object: Deno.lint.Expression): boolean {
  return object.type === "Identifier" && object.name === "React";
}

function reactMemberHookName(
  callee: Deno.lint.MemberExpression,
): string | null {
  if (callee.property.type !== "Identifier") return null;
  if (!isReactObject(callee.object)) return null;
  return bannedName(callee.property.name);
}

function bannedHookName(callee: Deno.lint.Expression): string | null {
  if (callee.type === "Identifier") return bannedName(callee.name);
  if (callee.type === "MemberExpression") return reactMemberHookName(callee);
  return null;
}

/** ARCH-002: presentation is props-only -- no local state or lifecycle hooks. */
export function createNoLocalStateRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forPresentationFiles(context, () => ({
        CallExpression(node) {
          if (bannedHookName(node.callee) === null) return;
          kit.reportAtNode({
            context,
            suppressor,
            ruleId: RULE_ID,
            node,
            message: MESSAGE,
          });
        },
      }));
    },
  };
}
