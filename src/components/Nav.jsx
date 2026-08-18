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
        <li><NavLink className="navlink" to="/work">work</NavLink></li>
        {!DEMO && session && (
          <li>
            <NavLink className="navlink navlink-draft" to="/shop" title="Visible only to us">
              shop
            </NavLink>
          </li>
        )}
        <li><NavLink className="navlink" to="/about">about</NavLink></li>
        <li><NavLink className="navlink" to="/contact">contact</NavLink></li>
        <li className="nav-divider" aria-hidden="true" />
        <li><NavLink className="navlink" to="/journal">field notes</NavLink></li>
      </ul>
    </nav>
  );
}
