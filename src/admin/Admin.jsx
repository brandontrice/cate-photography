import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";
import AdminAlbums from "./AdminAlbums";
import AdminAlbum from "./AdminAlbum";
import AdminNotes from "./AdminNotes";
import ResetPassword from "./ResetPassword";
import AdminPosts from "./AdminPosts";
import AdminPost from "./AdminPost";
import AdminActivity from "./AdminActivity";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

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
        <form
          className="card"
          style={{ maxWidth: 420 }}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
          }}
        >
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
          <button type="submit">Sign in</button>
          <button
            type="button"
            className="ghost"
            style={{ marginLeft: "0.6rem" }}
            onClick={async () => {
              setError("");
              setInfo("");
              if (!email) return setError("Type the email above first, then press this again.");
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + "/admin/reset",
              });
              if (error) setError(error.message);
              else setInfo(`Reset link sent to ${email}. It signs you in and asks for a new password.`);
            }}
          >
            Forgot password
          </button>
          {error && <p className="msg">{error}</p>}
          {info && <p className="msg">{info}</p>}
        </form>
      </main>
    );

  return (
    <Routes>
      <Route index element={<AdminAlbums />} />
      <Route path="notes" element={<AdminNotes />} />
      <Route path="reset" element={<ResetPassword />} />
      <Route path="posts" element={<AdminPosts />} />
      <Route path="posts/:postId" element={<AdminPost />} />
      <Route path="activity" element={<AdminActivity />} />
      <Route path=":albumId" element={<AdminAlbum />} />
    </Routes>
  );
}
