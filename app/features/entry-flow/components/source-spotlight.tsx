export function SourceSpotlight() {
  return (
    <div className="source-spotlight" aria-hidden="true">
      <svg
        className="source-spotlight__svg"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer aperture ring */}
        <circle
          cx="200"
          cy="200"
          r="180"
          stroke="rgb(var(--brand-rgb))"
          strokeWidth="1"
          opacity="0.15"
        />
        <circle
          cx="200"
          cy="200"
          r="150"
          stroke="rgb(var(--brand-rgb))"
          strokeWidth="0.5"
          opacity="0.25"
        />
        <circle
          cx="200"
          cy="200"
          r="120"
          stroke="rgb(var(--brand-rgb))"
          strokeWidth="0.75"
          opacity="0.35"
        />

        {/* Aperture blades */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="200"
            y1="50"
            x2="200"
            y2="80"
            stroke="rgb(var(--brand-rgb))"
            strokeWidth="0.5"
            opacity="0.2"
            transform={`rotate(${angle} 200 200)`}
          />
        ))}

        {/* Film gate — outer frame */}
        <rect
          x="140"
          y="130"
          width="120"
          height="140"
          rx="4"
          stroke="rgb(var(--ink-muted-rgb))"
          strokeWidth="0.75"
          opacity="0.3"
        />

        {/* Film gate — inner aperture */}
        <rect
          x="150"
          y="142"
          width="100"
          height="116"
          rx="2"
          stroke="rgb(var(--ink-muted-rgb))"
          strokeWidth="0.5"
          opacity="0.2"
        />

        {/* Sprocket holes — left side */}
        {[152, 168, 184, 200, 216, 232, 248].map((y) => (
          <rect
            key={`l-${y}`}
            x="131"
            y={y}
            width="6"
            height="8"
            rx="1"
            fill="rgb(var(--surface-raised-rgb))"
            opacity="0.4"
          />
        ))}

        {/* Sprocket holes — right side */}
        {[152, 168, 184, 200, 216, 232, 248].map((y) => (
          <rect
            key={`r-${y}`}
            x="263"
            y={y}
            width="6"
            height="8"
            rx="1"
            fill="rgb(var(--surface-raised-rgb))"
            opacity="0.4"
          />
        ))}

        {/* Inner film gate fill */}
        <rect
          x="150"
          y="142"
          width="100"
          height="116"
          rx="2"
          fill="rgb(var(--surface-sunken-rgb))"
          opacity="0.6"
        />
      </svg>

      <div className="source-spotlight__text">
        <p className="source-spotlight__tagline">
          A room for the picture.
        </p>
      </div>
    </div>
  );
}
