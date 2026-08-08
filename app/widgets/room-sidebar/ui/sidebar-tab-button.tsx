export interface SidebarTabButtonProps {
  active: boolean;
  testId: string;
  label: string;
  onClick: () => void;
}

export default function SidebarTabButton({
  active,
  testId,
  label,
  onClick,
}: SidebarTabButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-md py-sm font-mono text-sm font-semibold transition-colors ${
        active
          ? "bg-brand-soft text-brand-text"
          : "text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
