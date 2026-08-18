import { embedFor } from "../lib/data";

// Plain writing, gently rendered: blank lines split paragraphs; a line that
// is only an Instagram or TikTok link becomes the embedded post.
export default function PostBody({ body }) {
  const blocks = (body || "").split(/\n\s*\n/).filter((b) => b.trim());
  return (
    <div className="post-body prose">
      {blocks.map((block, i) => {
        const embed = embedFor(block);
        if (embed)
          return (
            <div className={`post-embed embed-${embed.kind}`} key={i}>
              <iframe
                src={embed.src}
                title={`${embed.kind} post`}
                loading="lazy"
                allowFullScreen
                frameBorder="0"
                scrolling="no"
              />
            </div>
          );
        return <p key={i}>{block.trim()}</p>;
      })}
    </div>
  );
}
