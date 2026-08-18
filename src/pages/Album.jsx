import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Photo from "../components/Photo";
import Lightbox from "../components/Lightbox";
import { getAlbum } from "../lib/data";
import { useTitle } from "../lib/title";
import { SiteGuide } from "../admin/guide";

export default function Album() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [missing, setMissing] = useState(false);
  const [lb, setLb] = useState(null);
  useTitle(album ? album.title : null);

  useEffect(() => {
    setAlbum(null);
    setMissing(false);
    getAlbum(slug)
      .then((a) => (a ? setAlbum(a) : setMissing(true)))
      .catch(console.error);
  }, [slug]);

  if (missing)
    return (
      <main className="page prose">
        <p>This collection isn&rsquo;t here.</p>
        <Link to="/work" className="label">← All collections</Link>
      </main>
    );

  if (!album) return <main className="page" />;

  return (
    <main className="flow" style={{ paddingTop: "22vh" }}>
      {!album.published && (
        <div className="draft-banner">
          Draft. Only you can see this. Publish it from the studio when it&rsquo;s ready.
        </div>
      )}
      <div className="flow-head">
        <span className="label">{album.title}</span>
      </div>
      <SiteGuide to="/admin" linkLabel="Edit this collection in the studio">
        Photos here follow the drag order in the studio, and each caption and place line is
        set by clicking the photo there. Click any photo on this page to view it large.
      </SiteGuide>
      {album.photos.map((p, i) => (
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
          ← All collections
        </Link>
      </div>

      {lb !== null && (
        <Lightbox photos={album.photos} index={lb} onClose={() => setLb(null)} onIndex={setLb} />
      )}
    </main>
  );
}
