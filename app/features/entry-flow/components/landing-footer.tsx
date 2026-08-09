export function LandingFooter() {
  return (
    <footer className="landing-footer" aria-label="Landing page footer">
      <div className="landing-footer-brand">
        <p className="landing-footer-wordmark">
          Sync <span>Party</span>
        </p>
        <p>The screen is better together.</p>
      </div>
      <div className="landing-footer-links">
        <nav aria-label="Footer navigation">
          <a href="#about">About</a>
          <a href="#help">Help</a>
          <a href="#sources">Sources</a>
        </nav>
        <p>
          Built by{" "}
          <a
            href="https://ashok-kaushik.dev/"
            target="_blank"
            rel="noreferrer"
          >
            Ashok Kaushik
          </a>
        </p>
      </div>
    </footer>
  );
}
