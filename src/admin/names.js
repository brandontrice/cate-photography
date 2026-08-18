// The two accounts, email (lowercase) to display name.
// EDIT THESE ONCE with the real login emails. This file is the only place
// names live, so future updates never overwrite them.
export const NAMES = {
  "catelay98@gmail.com": "Cate",
  "btrice9595@gmail.com": "Brandon",
};

export function displayName(email) {
  if (!email) return "there";
  const known = NAMES[email.toLowerCase()];
  if (known) return known;
  const raw = email.split("@")[0].split(/[._-]/)[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
