const posters = [
  {
    title: "Metropolis",
    meta: "Fritz Lang · 1927",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/78/1927_Boris_Bilinski_%281900-1948%29_Plakat_f%C3%BCr_den_Film_Metropolis%2C_Staatliche_Museen_zu_Berlin.jpg?width=600",
  },
  {
    title: "The General",
    meta: "Buster Keaton · 1926",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/36/The_General_%281926%29_-_Movie_Poster.png?width=600",
  },
  {
    title: "Safety Last!",
    meta: "Fred Newmeyer · 1923",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Safety_last_poster.jpg?width=600",
  },
  {
    title: "Caligari",
    meta: "Robert Wiene · 1920",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/74/CABINETOFDRCALIGARI-poster.jpg?width=600",
  },
];

function Poster({ image, title, meta }: typeof posters[number]) {
  return (
    <article className="landing-poster">
      <img src={image} alt="" loading="lazy" />
      <div className="landing-poster-content">
        <span className="landing-poster-code">PUBLIC DOMAIN · U.S.</span>
        <strong>{title}</strong>
        <small>{meta}</small>
      </div>
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
