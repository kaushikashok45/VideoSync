type InfoPanel = {
  id: string;
  heading: string;
  body: string;
};

const PANELS: InfoPanel[] = [
  {
    id: "about",
    heading: "About Sync Party",
    body:
      "A private room for watching something together, wherever everyone actually is. Bring a file, share a link, stay in sync.",
  },
  {
    id: "help",
    heading: "Need a hand?",
    body:
      "Starting a room makes you the host. Joining one just takes a room code — playback, reactions, and everyone else in the room show up as soon as you're in.",
  },
  {
    id: "policy",
    heading: "Room limits",
    body:
      "Rooms hold up to 15 people at once. If a room's full, the host will need to make space before anyone else can join.",
  },
];

function InfoSection({ id, heading, body }: InfoPanel) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{heading}</h2>
      <p>{body}</p>
    </section>
  );
}

export function LandingInfo() {
  return (
    <div className="landing-info-grid">
      {PANELS.map((panel) => <InfoSection key={panel.id} {...panel} />)}
    </div>
  );
}
