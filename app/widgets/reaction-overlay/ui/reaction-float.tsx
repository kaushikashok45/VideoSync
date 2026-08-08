export interface ReactionFloatProps {
  emoji: string;
  x: number;
}

export default function ReactionFloat({ emoji, x }: ReactionFloatProps) {
  return (
    <span
      data-testid="reaction-float"
      data-reaction-emoji={emoji}
      aria-hidden="true"
      className="absolute bottom-lg animate-reaction-float select-none text-4xl motion-reduce:animate-fade-in"
      style={{ left: `${x}%` }}
    >
      {emoji}
    </span>
  );
}
