import { SOCIALS } from "../components/Footer";
import { useTitle } from "../lib/title";

export default function Contact() {
  useTitle("Contact");
  return (
    <main className="page">
      <span className="label">Contact</span>
      <div className="prose" style={{ marginTop: "3rem" }}>
        <p>For prints, commissions, or a walk in the fog.</p>
        <div className="contact-links">
          <a href="mailto:catelay98@gmail.com">
            <span>Email</span>
            <span className="label">catelay98@gmail.com</span>
          </a>
          {SOCIALS.map(({ label, Icon, handle, url }) => (
            <a key={label} href={url} target="_blank" rel="noreferrer">
              <span><Icon /> {label}</span>
              <span className="label">{handle}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
