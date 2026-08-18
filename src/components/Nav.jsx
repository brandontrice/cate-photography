import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";

export default function Nav() {
  const [session, setSession] = useState(null);
  const [hasPosts, setHasPosts] = useState(false);

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (DEMO) return;
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .then(({ count }) => setHasPosts((count || 0) > 0));
  }, []);

  return (
    <nav className="nav">
      <Link to="/" className="wordmark">Cate</Link>
      <ul>
        <li><NavLink className="navlink" to="/work">Work</NavLink></li>
        {hasPosts && <li><NavLink className="navlink" to="/journal">Field Notes</NavLink></li>}
        <li><NavLink className="navlink" to="/about">About</NavLink></li>
        <li><NavLink className="navlink" to="/contact">Contact</NavLink></li>
        {!DEMO && session && (
          <li>
            <NavLink className="navlink navlink-draft" to="/shop" title="Visible only to us">
              Shop draft
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
