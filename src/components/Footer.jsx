import { InstagramIcon, TikTokIcon } from "./SocialIcons";

const SOCIALS = [
  { label: "Instagram", Icon: InstagramIcon, handle: "@stillsbycate", url: "https://instagram.com/stillsbycate" },
  { label: "TikTok", Icon: TikTokIcon, handle: "@wanderingwithcate", url: "https://tiktok.com/@wanderingwithcate" },
];

export { SOCIALS };

export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Cate</span>
      <span className="footer-social">
        {SOCIALS.map(({ label, Icon, handle, url }) => (
          <a key={label} href={url} target="_blank" rel="noreferrer" title={label}>
            <Icon /> {handle}
          </a>
        ))}
      </span>
      <span className="footer-right">
        Southwest Virginia
        <a href="/admin" className="studio-link">Studio</a>
      </span>
    </footer>
  );
}
