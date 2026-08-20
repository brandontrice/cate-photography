// Shown in place of a page's content when its data failed to load — e.g. a
// Supabase outage — so a fetch failure reads as an error, not a blank page.
export default function LoadError() {
  return <p className="load-error">Couldn&rsquo;t load this page. Try refreshing.</p>;
}
