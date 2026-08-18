import { createContext, useContext, useState } from "react";

// The studio guide: a toggle that annotates every section with what it does.
// State persists per browser so it stays how each person left it.
const GuideContext = createContext([false, () => {}]);

export function GuideProvider({ children }) {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem("studio-guide") === "on";
    } catch {
      return false;
    }
  });
  function toggle() {
    setOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("studio-guide", next ? "on" : "off");
      } catch {
        // Private browsing or blocked storage: the toggle still works for the session.
      }
      return next;
    });
  }
  return <GuideContext.Provider value={[on, toggle]}>{children}</GuideContext.Provider>;
}

export function GuideToggle() {
  const [on, toggle] = useContext(GuideContext);
  return (
    <button className={`ghost guide-toggle${on ? " on" : ""}`} onClick={toggle}>
      {on ? "Guide on" : "Guide"}
    </button>
  );
}

export function Guide({ children }) {
  const [on] = useContext(GuideContext);
  if (!on) return null;
  return <p className="guide-note">{children}</p>;
}
