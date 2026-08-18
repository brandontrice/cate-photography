import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Sets a new password for whoever is signed in. Reached two ways: from the
// studio nav, or by the email reset link (which signs you in and lands here).
export default function ResetPassword() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  return (
    <main className="admin">
      <Link to="/admin" className="label">← Studio</Link>
      <h1>Set a new password</h1>
      {done ? (
        <div className="card">
          <p className="msg">Password changed. It takes effect right away.</p>
          <Link to="/admin"><button style={{ marginTop: "0.8rem" }}>Back to the studio</button></Link>
        </div>
      ) : (
        <form
          className="card"
          style={{ maxWidth: 420 }}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (pw.length < 8) return setError("Use at least 8 characters.");
            if (pw !== confirm) return setError("The two entries do not match.");
            const { error } = await supabase.auth.updateUser({ password: pw });
            if (error) setError(error.message);
            else setDone(true);
          }}
        >
          <input
            type="password"
            placeholder="New password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="New password again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <button type="submit">Change password</button>
          {error && <p className="msg">{error}</p>}
        </form>
      )}
    </main>
  );
}
