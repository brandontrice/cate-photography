import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo";
import { getAlbums } from "../lib/data";
import { useTitle } from "../lib/title";
import { SiteGuide } from "../admin/guide";

export default function Work() {
  const [albums, setAlbums] = useState([]);
  useTitle("Work");

  useEffect(() => {
    getAlbums()
      .then((all) => setAlbums(all.filter((a) => a.slug !== "featured")))
      .catch(console.error);
  }, []);

  return (
    <main className="page">
      <span className="label">Collections</span>
      <SiteGuide to="/admin" linkLabel="Manage them in the studio">
        Published collections in studio drag order. Featured is not listed here because it is
        the home page. Card faces are each collection&rsquo;s cover photo.
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
    </main>
  );
}
