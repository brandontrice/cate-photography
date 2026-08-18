// Release history, newest first. Add an entry at the top with every push;
// the site shows the newest once to each signed-in person, and the footer
// carries the current version.
export const RELEASES = [
  {
    version: "v12",
    date: "August 18, 2026",
    notes: [
      "The phone pass. The menu fits small screens and nothing scrolls sideways anymore.",
      "Buttons look like ours on iPhones instead of Apple's rounded defaults.",
      "The bottom tools start tucked away on phones; tap tools to open them. They clear the browser bar now.",
      "The footer stacks cleanly on narrow screens, and the opening previews in the studio keep their shape.",
      "Also: add note now sits before tasks in the tools row.",
    ],
  },
  {
    version: "v11",
    date: "August 18, 2026",
    notes: [
      "Guide dots sized and anchored properly, beside the labels they explain.",
      "The background breathes on a quicker, livelier cycle.",
      "Whose-court chips are color-coded: sage is Brandon, bone is Cate, at the chip, the pin, and the group edge alike.",
      "The menu says shop now; everything here is a working draft anyway.",
      "Six questions from Brandon planted as tasks, pinned where each decision lives: the About text, the contact email, the shop direction, captions, the meadow photo, and the first Field Note.",
    ],
  },
  {
    version: "v10",
    date: "August 18, 2026",
    notes: [
      "One tools cluster everywhere: guide, tasks, add note, sign out. Same on the site and in the studio.",
      "Notes and tasks are one thing now: you add a note, and open notes are your tasks. The list lives under tasks; the old address still works.",
      "The guide no longer moves the page. Small dots mark each explained spot; hover or tap one to read.",
    ],
  },
  {
    version: "v9",
    date: "August 18, 2026",
    notes: [
      "The studio leads with the collections; field notes and activity live in tabs beneath the greeting.",
      "The site speaks lowercase now, in a warmer small type (Karla).",
      "Dev tools gathered in the bottom corner: guide, notes, tasks, add note, sign out. The x hides them; tools brings them back.",
      "An activity log records every studio change, readable under the activity tab.",
      "The menu reads work, shop draft, about, contact, then field notes past the divider.",
      "Fixed the long empty scroll after the footer on short pages.",
    ],
  },
  {
    version: "v8",
    date: "August 18, 2026",
    notes: [
      "Field Notes now shows in the site menu even before the first entry.",
      "Release notes: this window. It opens once per release for each of us, and the version in the footer opens the full history.",
      "The studio landing is reorganized: one Collections card with creation built in, a tidy row of studio tools, and a lighter header.",
      "The guide now explains which Featured photo lands in which opening slot.",
    ],
  },
  {
    version: "v7",
    date: "August 18, 2026",
    notes: [
      "Field Notes: a journal written from the studio. Paste an Instagram or TikTok link on its own line and it becomes the post.",
      "Shop draft moved into the main menu with Prints and Digital tabs.",
      "Straight-in opening now lists the collections beside the name.",
      "Instagram and TikTok icons on the handles, Southwest Virginia in the footer and About, real contact email in place.",
      "The background breathes slowly between forest green and matte black.",
    ],
  },
  {
    version: "v6",
    date: "August 18, 2026",
    notes: [
      "Collections can be renamed; old links quietly redirect.",
      "Five home page openings, chosen from small living previews.",
      "Notes gained replies (two per note), authors, and whose-court chips; the list sorts into Waiting on you and Waiting on them.",
      "A shop mockup page for comparing the two directions.",
    ],
  },
  {
    version: "v5",
    date: "August 17, 2026",
    notes: [
      "The studio got a face: greeting, stats, cover thumbnails, and the guide that explains every section in place.",
      "Featured pinned in the collections list; it is the home page.",
    ],
  },
  {
    version: "v4",
    date: "August 17, 2026",
    notes: [
      "Wall arrangements became a studio choice.",
      "Notes on the site: pin a thought to any spot, work the list from the studio.",
    ],
  },
  {
    version: "v3",
    date: "August 17, 2026",
    notes: [
      "Password self-service, sign out from the site, click-to-view lightbox, caption editing, cover photos, drag ordering everywhere.",
    ],
  },
  {
    version: "v2",
    date: "August 17, 2026",
    notes: [
      "The studio opened: collections, uploads that resize themselves, publishing, and the site went live on the real internet.",
    ],
  },
  {
    version: "v1",
    date: "August 17, 2026",
    notes: ["The site was born at the beach, with the fog road leading."],
  },
];

export const CURRENT_VERSION = RELEASES[0].version;
