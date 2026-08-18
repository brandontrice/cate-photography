import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { displayName } from "./names";
import { Guide } from "./guide";

export default function AdminActivity() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    supabase
      .from("site_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <main className="admin">
      <Link to="/admin" className="label">← studio</Link>
      <h1>Activity</h1>
      <Guide>
        Every studio change lands here automatically: who did what, to what, and when. It is
        a paper trail, not an undo button; reverting something means changing it back by
        hand with this list as the reference.
      </Guide>
      <div className="card">
        {rows.length === 0 && <p className="msg">Nothing recorded yet.</p>}
        {rows.map((r) => (
          <div className="row activity-row" key={r.id}>
            <div style={{ flex: 1 }}>
              <span className="note-author">{displayName(r.author)}</span>
              {r.action}
              {r.subject && <span style={{ color: "var(--bone)" }}> {r.subject}</span>}
              {r.details && <span className="hint"> · {r.details}</span>}
            </div>
            <span className="hint activity-when">
              {new Date(r.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
