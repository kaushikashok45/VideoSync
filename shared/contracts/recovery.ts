export type RecoveryAction =
  | { kind: "retry" }
  | { kind: "reconnect" }
  | { kind: "rejoin" }
  | { kind: "home" }
  | { kind: "choose-source" }
  | { kind: "resync" };

export interface Recovery {
  label: string;
  action: RecoveryAction;
}
