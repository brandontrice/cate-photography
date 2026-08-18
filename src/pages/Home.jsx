import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo";
import Lightbox from "../components/Lightbox";
import { getFeatured, getAlbums, getWallLayout, openingCount } from "../lib/data";
import { useTitle } from "../lib/title";
import { SiteGuide } from "../admin/guide";

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

  // The opening consumes 0, 1, or 3 Featured photos depending on the mode.
  const count = openingCount(layout);
  const wall = photos.slice(0, count);
  const rest = photos.slice(count);

  return (
    <main>
      <section className={`opening opening-${layout}`}>
        <div className="opening-type">
          <h1>Cate</h1>
          <p className="opening-line">Photographs from quiet&nbsp;places.</p>
          <span className="label">Blue Ridge &amp; beyond</span>
        </div>
        <div className="wall-guide-slot">
          <SiteGuide to="/admin" linkLabel="Arrange it in the studio">
            The opening uses the front of the Featured collection: three photos as a wall,
            one as a single frame, or none at all, depending on the Home page opening picker
            in the studio.
          </SiteGuide>
        </div>
        {count > 0 && (
          <div className={`wall layout-${layout}`}>
            {wall.map((p, i) => (
              <figure
                className={`wall-piece wall-${i + 1}${count === 1 ? " wall-solo" : ""}`}
                key={p.id}
                onClick={() => setLb(i)}
              >
                <Photo photo={p} eager={i === 0} sizes="(min-width: 900px) 46vw, 80vw" />
                <figcaption>
                  <span>{p.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="flow home-flow">
        <div className="flow-head">
          <span className="label">Selected</span>
        </div>
        <SiteGuide to="/admin" linkLabel="Curate it in the studio">
          This walk is the rest of Featured, photo four onward, in drag order. Captions and
          places come from clicking a photo in the studio.
        </SiteGuide>
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
        <SiteGuide to="/admin" linkLabel="Reorder them in the studio">
          Every published collection, in the order they are dragged in the studio. Each card
          wears its cover photo.
        </SiteGuide>
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
