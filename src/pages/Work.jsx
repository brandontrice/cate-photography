import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo";
import { getAlbums } from "../lib/data";
import { useTitle } from "../lib/title";

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
