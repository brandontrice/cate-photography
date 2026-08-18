const SOCIALS = [
  { label: "Instagram", handle: "@stillsbycate", url: "https://instagram.com/stillsbycate" },
  { label: "TikTok", handle: "@wanderingwithcate", url: "https://tiktok.com/@wanderingwithcate" },
];

export { SOCIALS };

export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Cate</span>
      <span className="footer-social">
        {SOCIALS.map((s) => (
          <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
            {s.handle}
          </a>
        ))}
      </span>
      <span className="footer-right">Roanoke, Virginia<a href="/admin" className="studio-link">Studio</a></span>
    </footer>
  );
}
