-- One-time: plants Brandon's open questions for Cate as tasks, pinned where
-- each decision lives. Run in Supabase > SQL Editor. Edit wording freely.

insert into site_notes (path, x_pct, y_pct, note, author) values
(
  '/about', 30, 35,
  'From Brandon: this About write-up is my placeholder prose, not your voice. Rewrite it the way you would actually say it. Reply here with the text or just edit and tell me.',
  'btrice9595@gmail.com'
),
(
  '/contact', 30, 40,
  'From Brandon: two decisions. 1) Keep catelay98@gmail.com as the public email, or set up a dedicated site mailbox? 2) Preferred way for people to reach you: email only, or DMs too?',
  'btrice9595@gmail.com'
),
(
  '/shop', 40, 30,
  'From Brandon: react to both shop concepts here. Sizes, the placeholder prices, and which direction wins. Also: watermark on web photos, yes or no? Any print border preference?',
  'btrice9595@gmail.com'
),
(
  '/', 25, 60,
  'From Brandon: caption check. A good half of the captions and places across the collections are my educated guesses. Open each collection in the studio, click the photos, and fix the fiction.',
  'btrice9595@gmail.com'
),
(
  '/work/ridge-and-valley', 45, 45,
  'From Brandon: the meadow photo with the two people and the dogs. Keep it public? And its caption is my invention entirely, so bless it or rewrite it.',
  'btrice9595@gmail.com'
),
(
  '/journal', 30, 40,
  'From Brandon: Field Notes is live and empty. What is the first entry? The fog road story, the beach where the site got built, or something else. Pick one and I will set you up.',
  'btrice9595@gmail.com'
);
