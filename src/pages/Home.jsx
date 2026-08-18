import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo";
import Lightbox from "../components/Lightbox";
import { getFeatured, getAlbums, getWallLayout } from "../lib/data";
import { useTitle } from "../lib/title";

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [lb, setLb] = useState(null);
  const [layout, setLayout] = useState("anchor-right");
  useTitle(null);

  useEffect(() => {
    getFeatured().then(setPhotos).catch(console.error);
    getWallLayout().then(setLayout).catch(console.error);
    getAlbums()
      .then((all) => setAlbums(all.filter((a) => a.slug !== "featured")))
      .catch(console.error);
  }, []);

  // The gallery wall: first three Featured photos, hung at different sizes.
  const wall = photos.slice(0, 3);
  // The flow continues with the rest.
  const rest = photos.slice(3);

  return (
    <main>
      <section className="opening">
        <div className="opening-type">
          <h1>Cate</h1>
          <p className="opening-line">Photographs from quiet&nbsp;places.</p>
          <span className="label">Blue Ridge &amp; beyond</span>
        </div>
        <div className={`wall layout-${layout}`}>
          {wall.map((p, i) => (
            <figure
              className={`wall-piece wall-${i + 1}`}
              key={p.id}
              onClick={() => setLb(i)}
            >
              <Photo photo={p} eager={i === 0} sizes="(min-width: 900px) 40vw, 70vw" />
              <figcaption>
                <span>{p.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="flow home-flow">
        <div className="flow-head">
          <span className="label">Selected</span>
        </div>
        {rest.map((p, i) => (
          <figure className="piece" key={p.id} onClick={() => setLb(i + wall.length)}>
            <Photo photo={p} sizes="(min-width: 760px) 720px, 100vw" />
            <figcaption>
              <span>{p.caption}</span>
              <span>{p.place}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="page home-collections">
        <div className="flow-head">
          <span className="label">Collections</span>
        </div>
        <div className="collections">
          {albums.map((a) => (
            <Link to={`/work/${a.slug}`} className="collection-card" key={a.id}>
              {a.cover && (
                <Photo photo={a.cover} sizes="(min-width: 760px) 50vw, 100vw" />
              )}
              <h2>{a.title}</h2>
              <span className="count label">
                {a.photos.length} photograph{a.photos.length === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {lb !== null && (
        <Lightbox photos={photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
      )}
    </main>
  );
}
