type Spotlight = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  imageQuery: string;
  imageAlt: string;
};

const SPOTLIGHTS: Spotlight[] = [
  {
    id: "reactions",
    eyebrow: "Live reactions",
    title: "See the room, not just hear it",
    body:
      "Emoji bursts and live cursors show up right on the video as your friends watch — the jump-scares and plot twists land together.",
    imageQuery: "Reactions+overlay",
    imageAlt:
      "Screenshot of reaction emoji appearing over a synced video stream",
  },
  {
    id: "invite",
    eyebrow: "One link",
    title: "Get everyone in with a single link",
    body:
      "Share a link or a short room code. Whoever opens it lands straight in the room, already in sync — no download, no account.",
    imageQuery: "Room+invite+screen",
    imageAlt: "Screenshot of the room invite screen with a shareable link",
  },
];

function ShowcaseRow({ spotlight, reversed }: {
  spotlight: Spotlight;
  reversed: boolean;
}) {
  return (
    <div
      className={`landing-showcase-row${reversed ? " is-reversed" : ""}`}
    >
      <div className="landing-showcase-copy">
        <p className="landing-showcase-eyebrow">{spotlight.eyebrow}</p>
        <h3>{spotlight.title}</h3>
        <p>{spotlight.body}</p>
      </div>
      <div className="landing-showcase-frame">
        <img
          src={`https://placehold.co/960x640/0a0a0a/a1a1a1?text=${spotlight.imageQuery}&font=roboto`}
          width={960}
          height={640}
          loading="lazy"
          alt={spotlight.imageAlt}
        />
      </div>
    </div>
  );
}

export function LandingShowcase() {
  return (
    <section className="landing-showcase" aria-label="Product highlights">
      {SPOTLIGHTS.map((spotlight, index) => (
        <ShowcaseRow
          key={spotlight.id}
          spotlight={spotlight}
          reversed={index % 2 === 1}
        />
      ))}
    </section>
  );
}
