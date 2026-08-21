import type { LcovRecord } from "../contracts/docs-check";

interface LcovState {
  file: string;
  linesFound: number;
  linesHit: number;
  branchesFound: number;
  branchesHit: number;
}

type NumericField = "linesFound" | "linesHit" | "branchesFound" | "branchesHit";

interface FieldSpec {
  readonly prefix: string;
  readonly key: NumericField;
}

const NUMERIC_FIELDS: readonly FieldSpec[] = [
  { prefix: "LF:", key: "linesFound" },
  { prefix: "LH:", key: "linesHit" },
  { prefix: "BRF:", key: "branchesFound" },
  { prefix: "BRH:", key: "branchesHit" },
];

function reset(state: LcovState): void {
  state.file = "";
  state.linesFound = 0;
  state.linesHit = 0;
  state.branchesFound = 0;
  state.branchesHit = 0;
}

function recordOf(state: LcovState): LcovRecord | null {
  return state.file.length === 0 ? null : { ...state };
}

function toNumber(text: string): number {
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function applyNumericField(state: LcovState, line: string): void {
  const spec = NUMERIC_FIELDS.find((field) => line.startsWith(field.prefix));
  if (spec !== undefined) {
    state[spec.key] = toNumber(line.slice(spec.prefix.length));
  }
}

function parseField(state: LcovState, line: string): void {
  if (line.startsWith("SF:")) state.file = line.slice(3);
  else applyNumericField(state, line);
}

function pushIfPresent(records: LcovRecord[], record: LcovRecord | null): void {
  if (record !== null) records.push(record);
}

function handleLine(
  records: LcovRecord[],
  state: LcovState,
  line: string,
): void {
  if (line !== "end_of_record") {
    parseField(state, line);
    return;
  }
  pushIfPresent(records, recordOf(state));
  reset(state);
}

export function parseLcov(text: string): readonly LcovRecord[] {
  const records: LcovRecord[] = [];
  const state: LcovState = {
    file: "",
    linesFound: 0,
    linesHit: 0,
    branchesFound: 0,
    branchesHit: 0,
  };
  for (const line of text.split(/\r?\n/)) handleLine(records, state, line);
  pushIfPresent(records, recordOf(state));
  return records;
}
