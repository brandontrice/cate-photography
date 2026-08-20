import { useEffect, useRef, useState } from "react";
import { SIZES } from "../lib/images";

// Width descriptors for the three sizes every photo is resized to at upload
// time. Camera photos are always wider than SIZES.lg to start, so each
// resized copy comes out at exactly its target width — these numbers match
// the real pixel widths of src_sm/src_md/src_lg.
function buildSrcSet(photo) {
  const pairs = [
    [photo.src_sm, SIZES.sm],
    [photo.src_md, SIZES.md],
    [photo.src_lg, SIZES.lg],
  ].filter(([src]) => src);
  return pairs.map(([src, w]) => `${src} ${w}w`).join(", ");
}

// The signature element: each frame develops like a print as it enters view.
export default function Photo({ photo, sizes = "100vw", eager = false }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(eager);

  useEffect(() => {
    if (eager || !ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "80px 0px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [eager]);

  const ratio = photo.width && photo.height ? `${photo.width} / ${photo.height}` : "3 / 2";

  return (
    <div ref={ref} className={`photo${inView ? " in" : ""}`} style={{ aspectRatio: ratio }}>
      {inView && (
        <img
          src={photo.src_lg || photo.src_md}
          srcSet={buildSrcSet(photo) || undefined}
          alt={photo.caption || ""}
          loading={eager ? "eager" : "lazy"}
          sizes={sizes}
          width={photo.width}
          height={photo.height}
        />
      )}
    </div>
  );
}
