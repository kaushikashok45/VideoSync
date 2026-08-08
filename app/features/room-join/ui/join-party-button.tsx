import { Button } from "~/shared/ui-kit/index.ts";

export interface JoinPartyButtonProps {
  label: string;
  onClick: () => void;
}

export default function JoinPartyButton({
  label,
  onClick,
}: JoinPartyButtonProps) {
  return (
    <Button variant="primary" size="lg" onClick={onClick}>
      {label}
    </Button>
  );
}
