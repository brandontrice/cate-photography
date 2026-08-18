// Minimal single-color glyphs in the site's muted voice.
export function InstagramIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-label="Instagram" role="img">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-label="TikTok" role="img">
      <path
        d="M14.5 3v10.4a3.4 3.4 0 1 1-3.4-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 5.5c.6 2.2 2.3 3.7 4.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
