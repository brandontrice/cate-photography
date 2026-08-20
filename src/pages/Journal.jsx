import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Photo from "../components/Photo";
import LoadError from "../components/LoadError";
import { getPosts } from "../lib/data";
import { useTitle } from "../lib/title";
import { SiteGuide } from "../admin/guide";

export default function Journal() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(false);
  useTitle("Field Notes");

  useEffect(() => {
    getPosts().then(setPosts).catch(() => setError(true));
  }, []);

  return (
    <main className="page">
      <span className="label">Field Notes</span>
      <SiteGuide to="/admin/posts" linkLabel="Write one in the studio">
        Entries written in the studio land here, newest first, once published. A line that is
        just an Instagram or TikTok link inside an entry shows up as the post itself.
      </SiteGuide>
      {error && <LoadError />}
      <div className="journal-list">
        {posts.map((p) => (
          <Link to={`/journal/${p.slug}`} className="journal-item" key={p.id}>
            {p.cover && (
              <div className="journal-cover">
                <Photo photo={p.cover} sizes="(min-width: 760px) 30vw, 100vw" />
              </div>
            )}
            <div>
              <h2>{p.title}</h2>
              <span className="label">
                {new Date(p.published_at || p.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </Link>
        ))}
        {!error && posts.length === 0 && <p className="prose">Nothing here yet.</p>}
      </div>
    </main>
  );
}
