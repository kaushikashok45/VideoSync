import { ReactionButton } from "~/shared/ui-kit/index.ts";

export interface ReactionRowProps {
  onReact: (emoji: string) => void;
}

const ALLOWED_EMOJI = ["👍", "😂", "😮", "❤️", "🔥"];

export default function ReactionRow({ onReact }: ReactionRowProps) {
  return (
    <div className="flex items-center justify-center gap-xs border-t border-line bg-surface p-sm">
      {ALLOWED_EMOJI.map((emoji) => (
        <ReactionButton
          key={emoji}
          emoji={emoji}
          label={`React ${emoji}`}
          onClick={() => onReact(emoji)}
        />
      ))}
    </div>
  );
}
