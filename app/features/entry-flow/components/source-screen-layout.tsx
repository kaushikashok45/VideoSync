import type { CSSProperties, ReactNode } from "react";
import { Badge, Button } from "~/shared/ui-kit/index.ts";

interface SourceScreenLayoutProps {
  eyebrowStyle: CSSProperties;
  headlineStyle: CSSProperties;
  notice: string | undefined;
  picker: ReactNode;
  input: ReactNode;
  actionStyle: CSSProperties;
  pending: boolean;
  disabled: boolean;
  actionLabel: string;
  helperText: string;
  error: string | null;
  onSubmit: () => void;
}

function SourceScreenBadge({ style }: { style: CSSProperties }) {
  return (
    <div className="animate-fade-up motion-reduce:animate-none" style={style}>
      <Badge variant="default" className="font-mono tracking-[0.08em]">
        Host only
      </Badge>
    </div>
  );
}

function SourceScreenHeadline({ style }: { style: CSSProperties }) {
  return (
    <div
      className="flex animate-fade-up flex-col items-center gap-sm motion-reduce:animate-none"
      style={style}
    >
      <h2 className="max-w-[20ch] text-3xl font-semibold leading-[1.15] text-ink text-balance md:text-4xl">
        Pick what everyone's about to watch.
      </h2>
      <p className="max-w-[42ch] text-sm leading-relaxed text-ink-muted text-pretty">
        Upload a file or drop in a link. Everyone sees it once you continue.
      </p>
    </div>
  );
}

interface IntroProps {
  eyebrowStyle: CSSProperties;
  headlineStyle: CSSProperties;
}

function SourceScreenIntro({ eyebrowStyle, headlineStyle }: IntroProps) {
  return (
    <>
      <SourceScreenBadge style={eyebrowStyle} />
      <SourceScreenHeadline style={headlineStyle} />
    </>
  );
}

function SourceScreenNotice({ notice }: { notice: string | undefined }) {
  if (!notice) return null;
  return (
    <p
      role="status"
      className="w-full border border-status-warning/30 bg-surface-raised px-md py-sm font-mono text-sm text-ink-muted"
    >
      {notice}
    </p>
  );
}

function SourceScreenActionHelper(
  { error, helperText }: { error: string | null; helperText: string },
) {
  return (
    <p
      className={`min-h-[1.25rem] font-mono text-xs ${
        error ? "text-status-danger" : "text-ink-faint"
      }`}
    >
      {helperText}
    </p>
  );
}

function SourceScreenAction(
  { pending, disabled, actionLabel, helperText, error, onSubmit, style }: {
    pending: boolean;
    disabled: boolean;
    actionLabel: string;
    helperText: string;
    error: string | null;
    onSubmit: () => void;
    style: CSSProperties;
  },
) {
  return (
    <div
      className="flex w-full animate-fade-up flex-col items-center gap-sm motion-reduce:animate-none"
      style={style}
    >
      <Button
        size="lg"
        className="w-full"
        loading={pending}
        disabled={disabled}
        onClick={onSubmit}
      >
        {pending ? "Preparing room preview" : actionLabel}
      </Button>
      <SourceScreenActionHelper error={error} helperText={helperText} />
    </div>
  );
}

function SourceScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-xl">
      <div className="relative w-full max-w-md">
        <div className="source-screen-field" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-lg text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SourceScreenLayout(props: SourceScreenLayoutProps) {
  return (
    <SourceScreenShell>
      <SourceScreenIntro
        eyebrowStyle={props.eyebrowStyle}
        headlineStyle={props.headlineStyle}
      />
      <SourceScreenNotice notice={props.notice} />
      {props.picker}
      {props.input}
      <SourceScreenAction
        pending={props.pending}
        disabled={props.disabled}
        actionLabel={props.actionLabel}
        helperText={props.helperText}
        error={props.error}
        onSubmit={props.onSubmit}
        style={props.actionStyle}
      />
    </SourceScreenShell>
  );
}
