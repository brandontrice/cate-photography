-- One-time: plants a note from Brandon in the Notes list for Cate to answer.
-- Run in Supabase > SQL Editor. Safe to edit the wording first.

insert into site_notes (path, x_pct, y_pct, note)
values (
  '/',
  92,
  2,
  'From Brandon: photo captions currently save only when you press Save. The other option is saving automatically as you type, which is easier but can save half-finished thoughts. Which do you want? Tell me, then hit Resolve on this note.'
);
