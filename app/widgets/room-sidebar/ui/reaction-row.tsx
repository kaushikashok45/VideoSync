import ReactionPicker from "~/widgets/reaction-overlay/ui/reaction-picker.tsx";

export interface ReactionRowProps {
  onReact: (emoji: string) => void;
}

export default function ReactionRow({ onReact }: ReactionRowProps) {
  return (
    <div className="flex items-center justify-center gap-xs border-t border-line bg-surface p-sm">
      <ReactionPicker onReact={onReact} />
    </div>
  );
}
