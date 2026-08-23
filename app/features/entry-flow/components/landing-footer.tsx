function FooterBrand() {
  return (
    <div className="landing-footer-brand">
      <p className="landing-footer-wordmark">
        Sync <span>Party</span>
      </p>
      <p>Approved for group viewing.</p>
    </div>
  );
}

function FooterLinks() {
  return (
    <div className="landing-footer-links">
      <nav aria-label="Footer navigation">
        <a href="#about">About</a>
        <a href="#help">Help</a>
        <a href="#policy">Policy</a>
      </nav>
      <p>
        Built by{" "}
        <a href="https://ashok-kaushik.dev/" target="_blank" rel="noreferrer">
          Ashok Kaushik
        </a>
      </p>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer" aria-label="Landing page footer">
      <FooterBrand />
      <FooterLinks />
    </footer>
  );
}
