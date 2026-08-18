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

  // The opening consumes 0, 1, or 3 visible Featured photos depending on the
  // mode. Hidden photos (visible only to signed-in eyes) never take a slot;
  // they appear ghosted in the flow instead.
  const count = openingCount(layout);
  const visible = photos.filter((p) => !p.hidden);
  const wall = visible.slice(0, count);
  const wallIds = new Set(wall.map((p) => p.id));
  const rest = photos.filter((p) => !wallIds.has(p.id));
  const display = [...wall, ...rest];

  return (
    <main>
      <section className={`opening opening-${layout}`}>
        <div className="opening-type">
          <h1>cate</h1>
          <p className="opening-line">photographs from quiet&nbsp;places.</p>
          <span className="label">
            Blue Ridge &amp; beyond
            <SiteGuide to="/admin" linkLabel="Arrange it in the studio">
              The opening is filled from the front of Featured: in wall modes photo 1 is the
              tall anchor, photo 2 the upper pair frame, photo 3 the accent. One frame shows
              photo 1 alone, and Straight in lists the collections here instead. Both the
              photos and the arrangement are set in the studio.
            </SiteGuide>
          </span>
        </div>
        {layout === "straight-in" && albums.length > 0 && (
          <nav className="opening-index" aria-label="Collections">
            {albums.map((a) => (
              <Link to={`/work/${a.slug}`} className="opening-index-item" key={a.id}>
                <span className="opening-index-title">{a.title}</span>
                <span className="label">
                  {a.visibleCount} photograph{a.visibleCount === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </nav>
        )}
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
          <span className="label">
            Selected
            <SiteGuide to="/admin" linkLabel="Curate it in the studio">
              This walk is the rest of Featured in drag order. Captions and places come from
              clicking a photo in the studio.
            </SiteGuide>
          </span>
        </div>
        {rest.map((p, i) => (
          <figure
            className={`piece${p.hidden ? " ghosted" : ""}`}
            key={p.id}
            onClick={() => setLb(i + wall.length)}
          >
            <Photo photo={p} sizes="(min-width: 760px) 720px, 100vw" />
            {p.hidden && <span className="hidden-tag">hidden</span>}
            <figcaption>
              <span>{p.caption}</span>
              <span>{p.place}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="page home-collections">
        <div className="flow-head">
          <span className="label">
            Collections
            <SiteGuide to="/admin" linkLabel="Reorder them in the studio">
              Every published collection, in the order they are dragged in the studio. Each
              card wears its cover photo.
            </SiteGuide>
          </span>
        </div>
        <div className="collections">
          {albums.map((a) => (
            <Link to={`/work/${a.slug}`} className="collection-card" key={a.id}>
              {a.cover && (
                <Photo photo={a.cover} sizes="(min-width: 760px) 50vw, 100vw" />
              )}
              <h2>{a.title}</h2>
              <span className="count label">
                {a.visibleCount} photograph{a.visibleCount === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {lb !== null && (
        <Lightbox photos={display} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
      )}
    </main>
  );
}
