import { Button } from "~/shared/ui-kit/index.ts";

export interface JoinPartyButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

export default function JoinPartyButton({
  label,
  onClick,
  loading = false,
}: JoinPartyButtonProps) {
  return (
    <Button variant="primary" size="lg" onClick={onClick} loading={loading}>
      {label}
    </Button>
  );
}
