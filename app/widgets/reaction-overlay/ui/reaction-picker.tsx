import { REACTION_EMOJIS } from "contracts/reaction-emojis.ts";
import { ReactionButton } from "~/shared/ui-kit/index.ts";

export interface ReactionPickerProps {
  onReact: (emoji: string) => void;
}

export default function ReactionPicker({ onReact }: ReactionPickerProps) {
  return (
    <div className="flex items-center justify-center gap-xs">
      {REACTION_EMOJIS.map((emoji) => (
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
