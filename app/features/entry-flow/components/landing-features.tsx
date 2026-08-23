import type { JSX } from "react";
import { Link2, MessageCircle, Users } from "lucide-react";

type Feature = {
  id: string;
  icon: JSX.Element;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    id: "link",
    icon: <Link2 size={18} aria-hidden="true" />,
    title: "One link, no accounts",
    body:
      "Start a room and send the link. Whoever opens it is watching with you — no sign-up on either end.",
  },
  {
    id: "sync",
    icon: <Users size={18} aria-hidden="true" />,
    title: "Everyone, same frame",
    body:
      "Playback stays lined up across every screen in the room, so nobody's a few seconds ahead or behind.",
  },
  {
    id: "react",
    icon: <MessageCircle size={18} aria-hidden="true" />,
    title: "Reactions, not a group chat",
    body:
      "See how your friends are reacting as the scene happens, without a separate call running alongside it.",
  },
];

export function LandingFeatures() {
  return (
    <section className="landing-section" aria-labelledby="features-heading">
      <h2 id="features-heading" className="landing-section-heading">
        Pick a room, not a platform
      </h2>
      <p className="landing-section-subtext">
        Sync Party is a room, not another app your friends have to install.
      </p>
      <div className="landing-features-grid">
        {FEATURES.map(({ id, icon, title, body }) => (
          <div key={id} className="landing-feature-card">
            <span className="landing-feature-icon">{icon}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
