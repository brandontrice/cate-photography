import { useTitle } from "../lib/title";

export default function About() {
  useTitle("About");
  return (
    <main className="page">
      <span className="label">About</span>
      <div className="prose" style={{ marginTop: "3rem" }}>
        <p>
          Cate photographs the hours most people sleep through &mdash; fog before it
          lifts, fields after the light leaves, the coast when the crowds go home.
        </p>
        <p>
          Based in Roanoke, Virginia, at the foot of the Blue Ridge. Available for
          prints and select commissions.
        </p>
        {/* Swap this copy for her real voice — write it together. */}
      </div>
    </main>
  );
}
