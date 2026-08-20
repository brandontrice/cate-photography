import { useEffect, useCallback, useRef } from "react";

export default function Lightbox({ photos, index, onClose, onIndex }) {
  const photo = photos[index];
  const rootRef = useRef(null);
  const previouslyFocused = useRef(null);

  const move = useCallback(
    (d) => onIndex((index + d + photos.length) % photos.length),
    [index, photos.length, onIndex]
  );

  // Move focus into the dialog on open, and back to whatever triggered it
  // (the clicked photo) on close, so keyboard/screen-reader users don't lose
  // their place.
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    rootRef.current?.querySelector(".lightbox-close")?.focus();
    return () => {
      if (previouslyFocused.current?.focus) previouslyFocused.current.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "Tab") {
        const focusable = rootRef.current?.querySelectorAll("button");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
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
    <div
      className="lightbox"
      ref={rootRef}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
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
