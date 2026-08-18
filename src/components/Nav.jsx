import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { supabase, DEMO } from "../lib/supabase";

export default function Nav() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (DEMO) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav className="nav">
      <Link to="/" className="wordmark">Cate</Link>
      <ul>
        <li><NavLink className="navlink" to="/work">Work</NavLink></li>
        <li><NavLink className="navlink" to="/journal">Field Notes</NavLink></li>
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
