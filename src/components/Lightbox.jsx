import { useEffect, useCallback } from "react";

export default function Lightbox({ photos, index, onClose, onIndex }) {
  const photo = photos[index];

  const move = useCallback(
    (d) => onIndex((index + d + photos.length) % photos.length),
    [index, photos.length, onIndex]
  );

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [move, onClose]);

  if (!photo) return null;

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label="Photo viewer">
      <img
        src={photo.src_lg || photo.src_md}
        alt={photo.caption || ""}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="lightbox-caption" onClick={(e) => e.stopPropagation()}>
        <span>{photo.caption}</span>
        <span>{photo.place}</span>
      </div>
      {photos.length > 1 && (
        <>
          <button
            className="lightbox-nav prev"
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); move(-1); }}
          >
            ←
          </button>
          <button
            className="lightbox-nav next"
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); move(1); }}
          >
            →
          </button>
        </>
      )}
      <button className="lightbox-close" aria-label="Close" onClick={onClose}>×</button>
    </div>
  );
}
