import { useEffect, useState } from "react";
import { supabase, DEMO } from "../lib/supabase";
import { getFeatured } from "../lib/data";
import Photo from "../components/Photo";
import { useTitle } from "../lib/title";

// A draft, visible only when signed in: two shop concepts side by side so
// Cate can compare them and pin notes right on this page. Nothing here is
// for sale yet. Placeholder pricing throughout.
const PRINT_SIZES = [
  { size: "8 × 10", price: "$45" },
  { size: "11 × 14", price: "$75" },
  { size: "16 × 20", price: "$120" },
];

export default function Shop() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [photos, setPhotos] = useState([]);
  useTitle("Shop (draft)");

  useEffect(() => {
    if (DEMO) return setChecked(true);
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getFeatured().then(setPhotos).catch(console.error);
  }, []);

  if (!checked) return <main className="page" />;
  if (DEMO || !session)
    return (
      <main className="page prose">
        <p>This page isn&rsquo;t here yet.</p>
      </main>
    );

  const printPhoto = photos[0];
  const digitalPhoto = photos[1] || photos[0];

  return (
    <main className="page">
      <div className="draft-banner">
        Draft. A mockup of two shop directions, visible only to us. Pin notes right on the
        parts you have opinions about.
      </div>
      <span className="label">Shop, two ways</span>

      <section className="shop-concepts">
        <div className="shop-card">
          <span className="label shop-tag">Concept one</span>
          <h2>Prints</h2>
          {printPhoto && <Photo photo={printPhoto} sizes="(min-width: 900px) 44vw, 100vw" />}
          <p className="shop-blurb">
            Museum-quality paper, shipped rolled or flat. Each order handled personally.
          </p>
          <table className="shop-table">
            <tbody>
              {PRINT_SIZES.map((r) => (
                <tr key={r.size}>
                  <td>{r.size}</td>
                  <td>{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <a
            className="shop-button"
            href="mailto:hello@example.com?subject=Print%20inquiry&body=Hi%20Cate%2C%20I%27m%20interested%20in%20a%20print%20of..."
          >
            Inquire to order
          </a>
          <p className="hint">
            No checkout needed to start: orders arrive as email, payment by invoice. The
            lowest-effort way to sell the first prints.
          </p>
        </div>

        <div className="shop-card">
          <span className="label shop-tag">Concept two</span>
          <h2>Digital</h2>
          {digitalPhoto && <Photo photo={digitalPhoto} sizes="(min-width: 900px) 44vw, 100vw" />}
          <p className="shop-blurb">
            Full-resolution JPEG, delivered instantly after purchase. Personal use and home
            printing, no commercial license.
          </p>
          <table className="shop-table">
            <tbody>
              <tr>
                <td>High-resolution file</td>
                <td>$15</td>
              </tr>
            </tbody>
          </table>
          <button className="shop-button" disabled>
            Coming soon
          </button>
          <p className="hint">
            Needs real checkout (card payment and automatic delivery), so it ships after the
            prints decision, not before.
          </p>
        </div>
      </section>
    </main>
  );
}
