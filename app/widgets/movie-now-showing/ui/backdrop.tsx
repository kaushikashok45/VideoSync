export interface BackdropProps {
  backdropUrl?: string;
}

export default function Backdrop({ backdropUrl }: BackdropProps) {
  if (backdropUrl === undefined) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface-sunken"
    >
      <img
        data-testid="backdrop-image"
        src={backdropUrl}
        alt=""
        className="h-full w-full scale-110 object-cover blur-2xl"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
    </div>
  );
}
