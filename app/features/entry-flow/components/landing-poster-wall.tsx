const posters = [
  { tone: "ember", title: "After the Rain", meta: "A film for two screens" },
  { tone: "harbor", title: "North Window", meta: "A shared screening" },
  { tone: "violet", title: "Soft Static", meta: "Play it together" },
  { tone: "ochre", title: "Small Hours", meta: "A shared moment" },
  { tone: "blue", title: "Common Ground", meta: "Invite your people" },
];

function Poster({ tone, title, meta }: typeof posters[number]) {
  return (
    <article className={`landing-poster landing-poster-${tone}`}>
      <span className="landing-poster-code">SP / FEATURE</span>
      <strong>{title}</strong>
      <small>{meta}</small>
    </article>
  );
}

export function LandingPosterWall() {
  return (
    <div className="landing-wall" aria-hidden="true">
      <div className="landing-wall-row landing-wall-row-back">
        {posters.map((poster) => <Poster key={poster.title} {...poster} />)}
      </div>
      <div className="landing-wall-row landing-wall-row-front">
        {posters.slice().reverse().map((poster) => (
          <Poster key={poster.title} {...poster} />
        ))}
      </div>
      <div className="landing-wall-scrim" />
    </div>
  );
}
