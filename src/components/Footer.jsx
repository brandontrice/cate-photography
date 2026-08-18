import { useEffect, useState } from "react";
import { supabase, DEMO } from "../lib/supabase";
import { CURRENT_VERSION } from "../data/releases";
import { InstagramIcon, TikTokIcon } from "./SocialIcons";

const SOCIALS = [
  { label: "Instagram", Icon: InstagramIcon, handle: "@stillsbycate", url: "https://instagram.com/stillsbycate" },
  { label: "TikTok", Icon: TikTokIcon, handle: "@wanderingwithcate", url: "https://tiktok.com/@wanderingwithcate" },
];

export { SOCIALS };

export default function Footer() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
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
        {session ? (
          <button
            className="version-link"
            title="Release history"
            onClick={() => window.dispatchEvent(new Event("open-releases"))}
          >
            {CURRENT_VERSION}
          </button>
        ) : (
          <span className="version-plain">{CURRENT_VERSION}</span>
        )}
      </span>
    </footer>
  );
}
