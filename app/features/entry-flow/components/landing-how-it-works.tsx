type Step = {
  id: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    id: "start",
    title: "Start a room",
    body: "Pick a file, hit start, and your room is live — no setup screens.",
  },
  {
    id: "share",
    title: "Share the link",
    body: "Send the link or room code to whoever's watching with you.",
  },
  {
    id: "watch",
    title: "Watch in sync",
    body:
      "Playback stays lined up for everyone, reactions and all, until the credits roll.",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="landing-section" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="landing-section-heading">
        Three steps, no learning curve
      </h2>
      <p className="landing-section-subtext">
        From an empty room to watching together takes less time than it does to
        explain it.
      </p>
      <ol className="landing-steps">
        {STEPS.map(({ id, title, body }) => (
          <li key={id} className="landing-step">
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
