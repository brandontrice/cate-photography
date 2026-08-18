import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Photo from "../components/Photo";
import PostBody from "../components/PostBody";
import { getPost } from "../lib/data";
import { useTitle } from "../lib/title";

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [missing, setMissing] = useState(false);
  useTitle(post ? post.title : "Field Notes");

  useEffect(() => {
    setPost(null);
    setMissing(false);
    getPost(slug)
      .then((p) => (p ? setPost(p) : setMissing(true)))
      .catch(console.error);
  }, [slug]);

  if (missing)
    return (
      <main className="page prose">
        <p>This entry isn&rsquo;t here.</p>
        <Link to="/journal" className="label">← Field Notes</Link>
      </main>
    );

  if (!post) return <main className="page" />;

  return (
    <main className="page post-page">
      {!post.published && (
        <div className="draft-banner">
          Draft. Only you can see this. Publish it from the studio when it&rsquo;s ready.
        </div>
      )}
      <Link to="/journal" className="label">← Field Notes</Link>
      <h1 className="post-title">{post.title}</h1>
      <span className="label">
        {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </span>
      {post.cover && (
        <div className="post-cover">
          <Photo photo={post.cover} sizes="(min-width: 900px) 760px, 100vw" />
        </div>
      )}
      <PostBody body={post.body} />
    </main>
  );
}
