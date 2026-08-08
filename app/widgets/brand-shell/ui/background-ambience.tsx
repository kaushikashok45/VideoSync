const ambienceStyles = `@keyframes ambience-drift {
  0%, 100% { transform: translate3d(-1.5%, 0, 0) scale(1); }
  50% { transform: translate3d(1.5%, -1.5%, 0) scale(1.05); }
}
.ambience-glow {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 70vmax;
  height: 70vmax;
  animation: ambience-drift 18s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ambience-glow { animation: none; }
}`;

export default function BackgroundAmbience() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <style>{ambienceStyles}</style>
      <div className="ambience-glow rounded-full bg-brand/15 blur-3xl" />
    </div>
  );
}
