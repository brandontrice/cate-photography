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
          {/* Swap in her real email when she has one she wants public. */}
          <a href="mailto:hello@example.com">
            <span>Email</span>
            <span className="label">hello@example.com</span>
          </a>
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
              <span>{s.label}</span>
              <span className="label">{s.handle}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
