// Local photo data — Cate's real photographs, served from /public/photos.
// This powers the site until Supabase is wired up; then the studio takes over.
// Captions and places are editable guesses — fix them together.

function p(slug, w, h, caption, place) {
  return {
    id: slug,
    src_sm: `/photos/${slug}-sm.webp`,
    src_md: `/photos/${slug}-md.webp`,
    src_lg: `/photos/${slug}-lg.webp`,
    width: w,
    height: h,
    caption,
    place,
  };
}

// ——— The photographs ———
const fogRoad       = p("fog-road", 5152, 6864, "The parkway, socked in", "Blue Ridge Parkway");
const fogPine       = p("fog-pine", 5152, 6864, "Holding its ground", "Blue Ridge Parkway");
const waterfall     = p("waterfall", 5152, 6864, "Falls in the rain", "Shenandoah");
const duskRidges    = p("dusk-ridges", 6864, 5152, "Blue on blue, last light", "Shenandoah Valley");
const sunriseValley = p("sunrise-valley", 5152, 6864, "First light over the valley", "Blue Ridge");
const sunriseClose  = p("sunrise-close", 3146, 4192, "The sun, close enough to hold", "Blue Ridge");
const meadowWalk    = p("meadow-walk", 6382, 4790, "Four of us, headed home", "Roanoke Valley");
const riverGorge    = p("river-gorge", 5152, 6864, "The long way through", "New River Gorge");
const forestPath    = p("forest-path", 5152, 6864, "Green on green", "Appalachian Trail");
const sycamoreRoots = p("sycamore-roots", 5152, 6864, "Sycamore, holding the bank", "Creekside");
const joePye        = p("joe-pye", 2266, 3022, "Joe-Pye weed, one visitor", "Late summer");
const dogwoodNight  = p("dogwood-night", 3424, 2568, "Dogwood after dark", "April, Virginia");
const beachTwo      = p("beach-two", 5152, 6864, "Two chairs, grey Atlantic", "Myrtle Beach");
const naturalBridge = p("natural-bridge", 2560, 3840, "Under the bridge", "Natural Bridge, Virginia");

export const sampleAlbums = [
  {
    id: "fog",
    slug: "fog",
    title: "Fog",
    published: true,
    photos: [fogRoad, fogPine, waterfall],
  },
  {
    id: "ridge-and-valley",
    slug: "ridge-and-valley",
    title: "Ridge & Valley",
    published: true,
    photos: [duskRidges, sunriseValley, meadowWalk, riverGorge, sunriseClose],
  },
  {
    id: "understory",
    slug: "understory",
    title: "Understory",
    published: true,
    photos: [forestPath, sycamoreRoots, joePye, dogwoodNight],
  },
  {
    id: "two",
    slug: "two",
    title: "Two",
    published: true,
    photos: [beachTwo, naturalBridge],
  },
];

export const sampleFeatured = [
  fogRoad,        // hero
  duskRidges,
  sycamoreRoots,
  beachTwo,
  dogwoodNight,
  sunriseValley,
];
