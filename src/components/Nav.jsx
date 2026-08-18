import { NavLink, Link } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="nav">
      <Link to="/" className="wordmark">Cate</Link>
      <ul>
        <li><NavLink className="navlink" to="/work">Work</NavLink></li>
        <li><NavLink className="navlink" to="/about">About</NavLink></li>
        <li><NavLink className="navlink" to="/contact">Contact</NavLink></li>
      </ul>
    </nav>
  );
}
