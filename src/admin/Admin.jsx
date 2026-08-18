import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";
import AdminAlbums from "./AdminAlbums";
import AdminAlbum from "./AdminAlbum";
import AdminNotes from "./AdminNotes";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (DEMO)
    return (
      <main className="admin">
        <h1>The studio</h1>
        <div className="card">
          <p>
            The studio needs Supabase before it can open. Copy <code>.env.example</code> to{" "}
            <code>.env</code>, fill in the two values, run the SQL in{" "}
            <code>supabase/schema.sql</code>, and restart the dev server. Steps are in the
            README.
          </p>
          <Link to="/" className="label">← Back to the site</Link>
        </div>
      </main>
    );

  if (!session)
    return (
      <main className="admin">
        <h1>The studio</h1>
        <div className="card" style={{ maxWidth: 420 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            onClick={async () => {
              setError("");
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) setError(error.message);
            }}
          >
            Sign in
          </button>
          {error && <p className="msg">{error}</p>}
        </div>
      </main>
    );

  return (
    <Routes>
      <Route index element={<AdminAlbums />} />
      <Route path="notes" element={<AdminNotes />} />
      <Route path=":albumId" element={<AdminAlbum />} />
    </Routes>
  );
}
