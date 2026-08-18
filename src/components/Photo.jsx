import { useEffect, useRef, useState } from "react";

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
