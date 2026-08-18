import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo";
import Lightbox from "../components/Lightbox";
import { getFeatured } from "../lib/data";
import { useTitle } from "../lib/title";

// True when the viewport is wide (landscape-shaped), kept in sync on resize.
function useWideScreen() {
  const query = "(min-aspect-ratio: 5/4)";
  const [wide, setWide] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setWide(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return wide;
}

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [lb, setLb] = useState(null);
  const wide = useWideScreen();
  useTitle(null);

  useEffect(() => {
    getFeatured().then(setPhotos).catch(console.error);
  }, []);

  // One hero, chosen here: first photo by default; on wide screens,
  // the first landscape-orientation photo if there is one.
  const landscape = photos.find((p) => p.width > p.height);
  const hero = wide && landscape ? landscape : photos[0];

  // The flow is everything except the photo actually shown as hero.
  const rest = photos.filter((p) => p !== hero);

  return (
    <main>
      <section className="hero">
        <div className="hero-img">
          {hero && <Photo key={hero.id} photo={hero} eager sizes="100vw" />}
        </div>
        <div className="hero-foot">
          <p className="hero-line">Photographs from quiet places.</p>
          <span className="label">Blue Ridge &amp; beyond</span>
        </div>
      </section>

      <section className="flow">
        <div className="flow-head">
          <span className="label">Selected</span>
        </div>
        {rest.map((p, i) => (
          <figure className="piece" key={p.id} onClick={() => setLb(i)}>
            <Photo photo={p} sizes="(min-width: 760px) 720px, 100vw" />
            <figcaption>
              <span>{p.caption}</span>
              <span>{p.place}</span>
            </figcaption>
          </figure>
        ))}
        <div className="flow-head">
          <Link to="/work" className="label" style={{ color: "var(--bone)" }}>
            All collections →
          </Link>
        </div>
      </section>

      {lb !== null && (
        <Lightbox photos={rest} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
      )}
    </main>
  );
}